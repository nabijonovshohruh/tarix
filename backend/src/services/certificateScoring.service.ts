import { CertGrade, CertQuestionType, CorrectOption, MatchAnswerOption } from "@prisma/client";
import { isFuzzyTextMatch } from "../utils/textMatch";

export interface GradableCertQuestion {
  id: bigint;
  type: CertQuestionType;
  order: number;
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctOption: CorrectOption | null;
  matchAnswer: MatchAnswerOption | null;
  openLabelA: string | null;
  openAnswerA: string | null;
  openLabelB: string | null;
  openAnswerB: string | null;
  explanation: string | null;
}

export interface SubmittedCertAnswer {
  questionId: string;
  selectedOption?: CorrectOption | null;
  selectedMatchAnswer?: MatchAnswerOption | null;
  answerA?: string | null;
  answerB?: string | null;
}

export interface CertAnswerSnapshot {
  questionId: bigint;
  order: number;
  type: CertQuestionType;
  questionText: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctOption: CorrectOption | null;
  selectedOption: CorrectOption | null;
  matchAnswer: MatchAnswerOption | null;
  selectedMatchAnswer: MatchAnswerOption | null;
  openLabelA: string | null;
  openAnswerA: string | null;
  studentAnswerA: string | null;
  openLabelB: string | null;
  openAnswerB: string | null;
  studentAnswerB: string | null;
  explanation: string | null;
  pointsEarned: number;
  maxPoints: number;
  isCorrect: boolean;
}

/**
 * Grades a single question against the student's submitted answer, branching
 * on question type:
 *  - MCQ: exact option match (A-D), worth 1 point.
 *  - MATCHING (Q33-35, per the official exam format): exact option match
 *    from a wider 6-option set (A-F) — a single-answer question, not a
 *    multi-pair matching table, so it's graded identically to MCQ.
 *  - OPEN: each populated sub-answer (a and/or b) is worth 1 point, checked
 *    with 1-edit-distance fuzzy matching (see textMatch.ts) rather than
 *    exact string equality, per the Q36-45 tolerant-grading requirement.
 */
export function gradeCertQuestion(
  question: GradableCertQuestion,
  answer: SubmittedCertAnswer | undefined
): CertAnswerSnapshot {
  const base = {
    questionId: question.id,
    order: question.order,
    type: question.type,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    explanation: question.explanation,
  };

  if (question.type === "MCQ") {
    const selectedOption = answer?.selectedOption ?? null;
    const isCorrect = selectedOption !== null && selectedOption === question.correctOption;
    return {
      ...base,
      correctOption: question.correctOption,
      selectedOption,
      matchAnswer: null,
      selectedMatchAnswer: null,
      openLabelA: null,
      openAnswerA: null,
      studentAnswerA: null,
      openLabelB: null,
      openAnswerB: null,
      studentAnswerB: null,
      pointsEarned: isCorrect ? 1 : 0,
      maxPoints: 1,
      isCorrect,
    };
  }

  if (question.type === "MATCHING") {
    const selectedMatchAnswer = answer?.selectedMatchAnswer ?? null;
    const isCorrect = selectedMatchAnswer !== null && selectedMatchAnswer === question.matchAnswer;
    return {
      ...base,
      correctOption: null,
      selectedOption: null,
      matchAnswer: question.matchAnswer,
      selectedMatchAnswer,
      openLabelA: null,
      openAnswerA: null,
      studentAnswerA: null,
      openLabelB: null,
      openAnswerB: null,
      studentAnswerB: null,
      pointsEarned: isCorrect ? 1 : 0,
      maxPoints: 1,
      isCorrect,
    };
  }

  // OPEN
  const studentAnswerA = answer?.answerA ?? null;
  const studentAnswerB = answer?.answerB ?? null;
  const hasPartA = question.openAnswerA != null && question.openAnswerA.length > 0;
  const hasPartB = question.openAnswerB != null && question.openAnswerB.length > 0;

  const correctA = hasPartA && isFuzzyTextMatch(studentAnswerA, question.openAnswerA as string);
  const correctB = hasPartB && isFuzzyTextMatch(studentAnswerB, question.openAnswerB as string);

  const maxPoints = (hasPartA ? 1 : 0) + (hasPartB ? 1 : 0);
  const pointsEarned = (correctA ? 1 : 0) + (correctB ? 1 : 0);

  return {
    ...base,
    correctOption: null,
    selectedOption: null,
    matchAnswer: null,
    selectedMatchAnswer: null,
    openLabelA: question.openLabelA,
    openAnswerA: question.openAnswerA,
    studentAnswerA,
    openLabelB: question.openLabelB,
    openAnswerB: question.openAnswerB,
    studentAnswerB,
    pointsEarned,
    maxPoints,
    isCorrect: maxPoints > 0 && pointsEarned === maxPoints,
  };
}

export interface CertGradeSummary {
  snapshots: CertAnswerSnapshot[];
  rawScore: number;
  maxPossible: number;
  percentage: number;
  correctQuestions: number;
  totalQuestions: number;
}

export function gradeCertSubmission(
  questions: GradableCertQuestion[],
  answers: SubmittedCertAnswer[]
): CertGradeSummary {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const snapshots = questions.map((q) => gradeCertQuestion(q, answerMap.get(q.id.toString())));

  const rawScore = snapshots.reduce((sum, s) => sum + s.pointsEarned, 0);
  const maxPossible = snapshots.reduce((sum, s) => sum + s.maxPoints, 0);
  const correctQuestions = snapshots.filter((s) => s.isCorrect).length;
  const percentage = maxPossible === 0 ? 0 : Math.round((rawScore / maxPossible) * 10000) / 100;

  return {
    snapshots,
    rawScore,
    maxPossible,
    percentage,
    correctQuestions,
    totalQuestions: questions.length,
  };
}

/**
 * Simplified Rasch-style proxy (no calibrated per-item difficulty data
 * exists yet, so this is not a true 1PL Rasch ability estimate): the raw
 * percentage is treated as a proportion-correct `p`, converted to a logit
 * via the standard logistic-odds transform ln(p/(1-p)), then rescaled to a
 * 100-point score with a mean-50/SD-10 T-score transform
 * (scaledScore = 50 + 10*logit), clamped to [0, 100]. Grade bands are the
 * fixed cutoff table below. `p` is clamped away from the 0/1 boundary with a
 * 1/(2*n) continuity correction (n = item count) so a perfect or zero score
 * never produces an infinite logit.
 */
const GRADE_BANDS: { min: number; grade: CertGrade }[] = [
  { min: 70, grade: "A_PLUS" },
  { min: 65, grade: "A" },
  { min: 60, grade: "B_PLUS" },
  { min: 55, grade: "B" },
  { min: 50, grade: "C_PLUS" },
  { min: 46, grade: "C" },
];

function gradeForScaledScore(scaledScore: number): CertGrade {
  for (const band of GRADE_BANDS) {
    if (scaledScore >= band.min) return band.grade;
  }
  return "NONE";
}

export interface RaschProxyScore {
  logit: number;
  scaledScore: number;
  grade: CertGrade;
}

export function computeRaschProxyScore(percentage: number, itemCount: number): RaschProxyScore {
  const p = percentage / 100;
  const epsilon = itemCount > 0 ? 1 / (2 * itemCount) : 0.01;
  const clampedP = Math.min(1 - epsilon, Math.max(epsilon, p));

  const logit = Math.log(clampedP / (1 - clampedP));
  const scaledScore = Math.min(100, Math.max(0, 50 + 10 * logit));

  return { logit, scaledScore, grade: gradeForScaledScore(scaledScore) };
}
