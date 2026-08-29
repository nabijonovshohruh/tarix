import { CertGrade } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { gradeForScaledScore } from "./certificateScoring.service";

export interface ItemResponse {
  itemKey: string;
  /** Fractional score in [0,1] — 1 for a fully-correct dichotomous item (MCQ/MATCHING), or pointsEarned/maxPoints for a two-part OPEN item. */
  score: number;
}

export interface PersonResponses {
  personKey: string;
  responses: ItemResponse[];
}

export interface CalibratedItem {
  itemKey: string;
  pValue: number;
  difficulty: number;
}

export interface CalibratedPerson {
  personKey: string;
  theta: number;
  scaledScore: number;
  grade: CertGrade;
}

export interface RaschCalibration {
  items: CalibratedItem[];
  persons: CalibratedPerson[];
  iterations: number;
}

const MAX_ITERATIONS = 30;
const CONVERGENCE_TOLERANCE = 0.005;
const MIN_INFORMATION = 1e-6;

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function populationVariance(values: number[], avg: number): number {
  return mean(values.map((v) => (v - avg) ** 2));
}

function logit(p: number): number {
  return Math.log(p / (1 - p));
}

/** Clamps a proportion away from the 0/1 boundary with a 1/(2n) continuity correction so its logit is always finite. */
function clampProportion(p: number, n: number): number {
  const epsilon = n > 0 ? 1 / (2 * n) : 0.01;
  return Math.min(1 - epsilon, Math.max(epsilon, p));
}

function probability(theta: number, difficulty: number): number {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}

const EXTREME_SOLVE_ITERATIONS = 15;
const EXTREME_SOLVE_TOLERANCE = 1e-4;

/** 1-D Newton solve for the ability that produces `observed` against a fixed set of item difficulties. */
function solveAbilityForObserved(observed: number, difficulties: number[], initialTheta: number): number {
  let theta = initialTheta;
  for (let i = 0; i < EXTREME_SOLVE_ITERATIONS; i++) {
    let expected = 0;
    let information = 0;
    for (const b of difficulties) {
      const p = probability(theta, b);
      expected += p;
      information += p * (1 - p);
    }
    if (information < MIN_INFORMATION) break;
    const delta = (observed - expected) / information;
    theta += delta;
    if (Math.abs(delta) < EXTREME_SOLVE_TOLERANCE) break;
  }
  return theta;
}

/** 1-D Newton solve for the difficulty that produces `observed` against a fixed set of person abilities. */
function solveDifficultyForObserved(observed: number, abilities: number[], initialB: number): number {
  let b = initialB;
  for (let i = 0; i < EXTREME_SOLVE_ITERATIONS; i++) {
    let expected = 0;
    let information = 0;
    for (const theta of abilities) {
      const p = probability(theta, b);
      expected += p;
      information += p * (1 - p);
    }
    if (information < MIN_INFORMATION) break;
    const delta = (expected - observed) / information;
    b += delta;
    if (Math.abs(delta) < EXTREME_SOLVE_TOLERANCE) break;
  }
  return b;
}

/**
 * Batch-calibrated 1PL Rasch (IRT) model — estimates item difficulty and
 * person ability jointly from the full response matrix of a single test,
 * rather than scoring each student against a fixed, arbitrary curve. Two
 * stages, both standard textbook methods (Wright & Stone / Linacre's PROX,
 * refined by joint maximum likelihood — the "UCON" algorithm):
 *
 *  1. PROX (normal-approximation) initial estimates: each item's and each
 *     person's proportion-correct is converted to a logit, then rescaled by
 *     an expansion factor derived from the spread of the *other* side's
 *     logits (items expand by person spread, and vice versa) — this
 *     compensates for the compression normal-approximation logits suffer
 *     relative to true Rasch estimates.
 *  2. Joint MLE (Newton-Raphson) refinement: alternately update every item
 *     difficulty (holding abilities fixed) and every person ability
 *     (holding difficulties fixed) by a Newton step — observed vs. expected
 *     score, scaled by the Fisher information — for a bounded number of
 *     iterations or until the largest single change drops below tolerance.
 *     Item difficulties are re-centered to mean 0 after every item-update
 *     pass, which is what fixes the model's otherwise-arbitrary origin
 *     (Rasch is invariant to shifting every θ and b by the same constant).
 *
 * Each "item" here is a whole certificate question (Q1-45), not a sub-part —
 * a two-part OPEN question (a+b) contributes its fractional score
 * (0, 0.5, or 1) rather than being split into two items, since per-sub-part
 * correctness isn't stored separately. This is a pragmatic extension of the
 * (strictly dichotomous) 1PL model to near-binary fractional data, not a
 * full partial-credit model — acceptable here since two-part OPEN questions
 * are a small minority of items and the fractional score still carries the
 * right ordinal signal (both wrong < one right < both right).
 */
export function calibrateRaschModel(persons: PersonResponses[]): RaschCalibration {
  const itemKeys = Array.from(new Set(persons.flatMap((p) => p.responses.map((r) => r.itemKey))));
  const itemIndex = new Map(itemKeys.map((key, i) => [key, i]));

  // Sparse [personIdx][itemIdx] -> score, so a question added/removed
  // mid-test (or a person with an incomplete snapshot) never forces a
  // dense rectangular matrix with fabricated zeros.
  const responsesByPerson: Map<number, number>[] = persons.map((person) => {
    const row = new Map<number, number>();
    for (const r of person.responses) {
      const idx = itemIndex.get(r.itemKey);
      if (idx !== undefined) row.set(idx, r.score);
    }
    return row;
  });

  const itemRespondents: number[][] = itemKeys.map((_, itemIdx) =>
    responsesByPerson.reduce<number[]>((acc, row, personIdx) => {
      if (row.has(itemIdx)) acc.push(personIdx);
      return acc;
    }, [])
  );

  // --- Stage 1: PROX initial estimates ---
  // Raw (uncorrected) sums, kept around to flag "extreme" items/persons
  // (everyone right, everyone wrong, or one person right/wrong on
  // everything) — their *unconstrained* MLE ability/difficulty is
  // infinite, so Newton-Raphson has nothing to converge to and keeps
  // pushing the estimate (and, via the shared expected-score equations,
  // every other item/person it touches) further out on every iteration.
  // Continuity-correcting the initial PROX proportion isn't enough on its
  // own — Stage 2 below still uses the raw (uncorrected) observed sum, so
  // an extreme case must be frozen at its PROX value rather than refined.
  const itemRawSums = itemKeys.map((_, itemIdx) => {
    const respondents = itemRespondents[itemIdx];
    return respondents.reduce((s, personIdx) => s + (responsesByPerson[personIdx].get(itemIdx) ?? 0), 0);
  });
  const isExtremeItem = itemKeys.map(
    (_, itemIdx) => itemRawSums[itemIdx] <= 1e-9 || Math.abs(itemRawSums[itemIdx] - itemRespondents[itemIdx].length) <= 1e-9
  );
  const personRawSums = responsesByPerson.map((row) => Array.from(row.values()).reduce((s, v) => s + v, 0));
  const isExtremePerson = responsesByPerson.map(
    (row, personIdx) => personRawSums[personIdx] <= 1e-9 || Math.abs(personRawSums[personIdx] - row.size) <= 1e-9
  );

  const itemPValues = itemKeys.map((_, itemIdx) => {
    const respondents = itemRespondents[itemIdx];
    return clampProportion(respondents.length > 0 ? itemRawSums[itemIdx] / respondents.length : 0.5, respondents.length);
  });
  const personPValues = responsesByPerson.map((row, personIdx) => {
    const count = row.size;
    return clampProportion(count > 0 ? personRawSums[personIdx] / count : 0.5, count);
  });

  const itemLogits = itemPValues.map(logit);
  const personLogits = personPValues.map(logit);

  const itemLogitMean = mean(itemLogits);
  const personLogitVariance = populationVariance(personLogits, mean(personLogits));
  const itemLogitVariance = populationVariance(itemLogits, itemLogitMean);

  const itemExpansion = Math.sqrt(1 + personLogitVariance / 2.89);
  const personExpansion = Math.sqrt(1 + itemLogitVariance / 2.89);

  let difficulties = itemLogits.map((x) => itemExpansion * (itemLogitMean - x));
  let abilities = personLogits.map((y) => personExpansion * y);

  // --- Stage 2: joint MLE (Newton-Raphson) refinement ---
  let iterations = 0;
  for (; iterations < MAX_ITERATIONS; iterations++) {
    let maxChange = 0;

    const nextDifficulties = difficulties.map((b_i, itemIdx) => {
      if (isExtremeItem[itemIdx]) return b_i;
      const respondents = itemRespondents[itemIdx];
      let expected = 0;
      let information = 0;
      let observed = 0;
      for (const personIdx of respondents) {
        const p = probability(abilities[personIdx], b_i);
        expected += p;
        information += p * (1 - p);
        observed += responsesByPerson[personIdx].get(itemIdx) ?? 0;
      }
      if (information < MIN_INFORMATION) return b_i;
      return b_i + (expected - observed) / information;
    });
    const centering = mean(nextDifficulties);
    difficulties = nextDifficulties.map((b) => b - centering);

    const nextAbilities = abilities.map((theta_j, personIdx) => {
      if (isExtremePerson[personIdx]) return theta_j;
      const row = responsesByPerson[personIdx];
      let expected = 0;
      let information = 0;
      let observed = 0;
      for (const [itemIdx, score] of row) {
        const p = probability(theta_j, difficulties[itemIdx]);
        expected += p;
        information += p * (1 - p);
        observed += score;
      }
      if (information < MIN_INFORMATION) return theta_j;
      const updated = theta_j + (observed - expected) / information;
      maxChange = Math.max(maxChange, Math.abs(updated - theta_j));
      return updated;
    });
    abilities = nextAbilities;

    if (maxChange < CONVERGENCE_TOLERANCE) {
      iterations++;
      break;
    }
  }

  // Ground the frozen extreme items/persons in the *converged* scale: their
  // PROX estimate was computed before item difficulties were refined, so
  // leaving it as-is can misorder them against non-extreme cases (e.g. a
  // perfect scorer ranking below a partial scorer, since the partial
  // scorer's ability was fit against the real calibrated item difficulties
  // and the perfect scorer's wasn't). Uses the standard continuity-corrected
  // extreme-score convention (observed treated as count∓0.3, not the true
  // 0/count) so the Newton solve still converges to a finite value.
  itemKeys.forEach((_, itemIdx) => {
    if (!isExtremeItem[itemIdx]) return;
    const respondents = itemRespondents[itemIdx];
    if (respondents.length === 0) return;
    const observed = itemRawSums[itemIdx] > 0 ? respondents.length - 0.3 : 0.3;
    const thetas = respondents.map((personIdx) => abilities[personIdx]);
    difficulties[itemIdx] = solveDifficultyForObserved(observed, thetas, difficulties[itemIdx]);
  });
  const finalCentering = mean(difficulties);
  difficulties = difficulties.map((b) => b - finalCentering);

  responsesByPerson.forEach((row, personIdx) => {
    if (!isExtremePerson[personIdx] || row.size === 0) return;
    const observed = personRawSums[personIdx] > 0 ? row.size - 0.3 : 0.3;
    const itemDifficulties = Array.from(row.keys()).map((itemIdx) => difficulties[itemIdx]);
    abilities[personIdx] = solveAbilityForObserved(observed, itemDifficulties, abilities[personIdx]);
  });

  const items: CalibratedItem[] = itemKeys.map((itemKey, i) => ({
    itemKey,
    pValue: itemPValues[i],
    difficulty: difficulties[i],
  }));

  const persons_: CalibratedPerson[] = persons.map((person, i) => {
    const theta = abilities[i];
    const scaledScore = Math.min(100, Math.max(0, 50 + 10 * theta));
    return { personKey: person.personKey, theta, scaledScore, grade: gradeForScaledScore(scaledScore) };
  });

  return { items, persons: persons_, iterations };
}

export interface CalibrationSummary {
  calibratedCount: number;
  meanScaledScore: number;
  itemCount: number;
  iterations: number;
}

/**
 * Loads every submitted result for a certificate test, runs the batch Rasch
 * calibration, writes each result's logit/scaledScore/grade back, and stamps
 * the test as released. Safe to re-run (e.g. after a late submission comes
 * in) — it always recomputes from scratch across the *current* full set of
 * results, overwriting any previous calibration.
 */
export async function calibrateCertificateTest(testId: bigint): Promise<CalibrationSummary> {
  const results = await prisma.certificateResult.findMany({
    where: { testId },
    include: { answers: true },
  });

  if (results.length === 0) {
    throw new HttpError(400, "Bu test uchun hali birorta ham javob topshirilmagan");
  }

  const persons: PersonResponses[] = results.map((result) => ({
    personKey: result.id.toString(),
    responses: result.answers
      .filter((a) => a.maxPoints > 0)
      .map((a) => ({ itemKey: a.order.toString(), score: a.pointsEarned / a.maxPoints })),
  }));

  const calibration = calibrateRaschModel(persons);
  const personByKey = new Map(calibration.persons.map((p) => [p.personKey, p]));

  await prisma.$transaction([
    ...results.map((result) => {
      const calibrated = personByKey.get(result.id.toString())!;
      return prisma.certificateResult.update({
        where: { id: result.id },
        data: {
          logit: calibrated.theta,
          scaledScore: calibrated.scaledScore,
          grade: calibrated.grade,
        },
      });
    }),
    prisma.certificateTest.update({ where: { id: testId }, data: { resultsReleasedAt: new Date() } }),
  ]);

  return {
    calibratedCount: results.length,
    meanScaledScore: mean(calibration.persons.map((p) => p.scaledScore)),
    itemCount: calibration.items.length,
    iterations: calibration.iterations,
  };
}
