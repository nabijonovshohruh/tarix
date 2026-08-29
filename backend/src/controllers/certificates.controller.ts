import { Request, Response } from "express";
import { z } from "zod";
import { CertificateQuestion, CertQuestionType, CorrectOption, Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import {
  computeRaschProxyScore,
  gradeCertSubmission,
  MATCH_OPTIONS,
  parseMatchItems,
  SubmittedCertAnswer,
} from "../services/certificateScoring.service";
import { generateTestCode } from "../utils/testCode";

const testInputSchema = z.object({
  title: z.string().min(1),
});

const testUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
});

const matchItemSchema = z.object({
  label: z.string().min(1),
  correctOption: z.enum(MATCH_OPTIONS),
});

// A discriminated union (rather than one flat optional-everything schema)
// so a MATCHING question can't be saved missing matchItems, an OPEN question
// can't be saved missing openAnswerA, etc. — Zod validates the combination,
// not just each field in isolation.
const questionInputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MCQ"),
    questionText: z.string().min(1),
    order: z.number().int().optional(),
    explanation: z.string().optional(),
    optionA: z.string().min(1),
    optionB: z.string().min(1),
    optionC: z.string().min(1),
    optionD: z.string().min(1),
    correctOption: z.nativeEnum(CorrectOption),
  }),
  z.object({
    type: z.literal("MATCHING"),
    questionText: z.string().min(1),
    order: z.number().int().optional(),
    explanation: z.string().optional(),
    matchItems: z.array(matchItemSchema).min(2),
  }),
  z.object({
    type: z.literal("OPEN"),
    questionText: z.string().min(1),
    order: z.number().int().optional(),
    explanation: z.string().optional(),
    openLabelA: z.string().optional(),
    openAnswerA: z.string().min(1),
    openLabelB: z.string().optional(),
    openAnswerB: z.string().optional(),
  }),
]);

type QuestionInput = z.infer<typeof questionInputSchema>;

function toQuestionData(body: QuestionInput) {
  const shared = {
    type: body.type as CertQuestionType,
    questionText: body.questionText,
    order: body.order ?? 0,
    explanation: body.explanation ?? null,
  };

  if (body.type === "MCQ") {
    return {
      ...shared,
      optionA: body.optionA,
      optionB: body.optionB,
      optionC: body.optionC,
      optionD: body.optionD,
      correctOption: body.correctOption,
      maxPoints: 1,
    };
  }

  if (body.type === "MATCHING") {
    return {
      ...shared,
      matchItems: body.matchItems,
      maxPoints: body.matchItems.length,
    };
  }

  // OPEN
  return {
    ...shared,
    openLabelA: body.openLabelA ?? null,
    openAnswerA: body.openAnswerA,
    openLabelB: body.openLabelB ?? null,
    openAnswerB: body.openAnswerB ?? null,
    maxPoints: body.openAnswerB ? 2 : 1,
  };
}

const accessSchema = z.object({
  code: z.string().trim().min(1),
});

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.nativeEnum(CorrectOption).optional(),
      selectedMatches: z
        .array(z.object({ label: z.string(), selectedOption: z.enum(MATCH_OPTIONS) }))
        .optional(),
      answerA: z.string().optional(),
      answerB: z.string().optional(),
    })
  ),
});

// The Mini App is a pure digital answer sheet — the questions themselves are
// distributed separately (printed/PDF), so a student never needs
// questionText, explanation, or MCQ option text, just enough structure to
// render the right input per question: A-D buttons (MCQ), an A-F dropdown
// per matched item (MATCHING), or one/two text fields (OPEN).
function toAnswerSheetQuestion(q: CertificateQuestion) {
  const base = { id: q.id.toString(), order: q.order, type: q.type };
  if (q.type === "MATCHING") {
    return { ...base, matchItems: parseMatchItems(q.matchItems).map((item) => ({ label: item.label })) };
  }
  if (q.type === "OPEN") {
    return { ...base, openLabelA: q.openLabelA, openLabelB: q.openLabelB };
  }
  return base;
}

async function generateUniqueTestCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateTestCode();
    const existing = await prisma.certificateTest.findUnique({ where: { testCode: code } });
    if (!existing) return code;
  }
  throw new HttpError(500, "test kodini generatsiya qilib bo'lmadi, qayta urinib ko'ring");
}

function buildAccessLink(code: string): string | null {
  if (!env.WEBAPP_URL) return null;
  const url = new URL(env.WEBAPP_URL);
  url.searchParams.set("certCode", code);
  return url.toString();
}

// Both routes below are admin-only (see certificates.routes.ts) — students
// never browse or open a certificate test by id, only via the test-code
// access flow (accessCertificateTestByCode), so there's no student-facing
// stripping/publish-gating to do here; admins manage drafts and published
// tests alike.
export async function listCertificateTests(req: Request, res: Response) {
  const tests = await prisma.certificateTest.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
  res.json({ tests });
}

export async function getCertificateTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const test = await prisma.certificateTest.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test) throw new HttpError(404, "test not found");

  res.json({ test, accessLink: buildAccessLink(test.testCode) });
}

export async function createCertificateTest(req: Request, res: Response) {
  const body = testInputSchema.parse(req.body);
  const testCode = await generateUniqueTestCode();
  const test = await prisma.certificateTest.create({ data: { ...body, testCode } });
  res.status(201).json({ test, accessLink: buildAccessLink(testCode) });
}

/**
 * Student entry point: trade a short PIN for the digital answer sheet.
 * Deliberately a POST (not GET /:code) so the code travels in the body, not
 * the URL/browser history, and to keep the "wrong code" / "not published"
 * cases both collapse to the same generic 404 (no oracle for guessing codes).
 */
export async function accessCertificateTestByCode(req: Request, res: Response) {
  const { code } = accessSchema.parse(req.body);

  const test = await prisma.certificateTest.findUnique({
    where: { testCode: code },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test || !test.isPublished) throw new HttpError(404, "Test kodi topilmadi");

  res.json({
    test: {
      id: test.id.toString(),
      title: test.title,
      questions: test.questions.map(toAnswerSheetQuestion),
    },
  });
}

export async function updateCertificateTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = testUpdateSchema.parse(req.body);
  const test = await prisma.certificateTest.update({ where: { id }, data: body });
  res.json({ test });
}

export async function deleteCertificateTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.certificateTest.delete({ where: { id } });
  res.status(204).send();
}

export async function addCertificateQuestion(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const body = questionInputSchema.parse(req.body);
  const question = await prisma.certificateQuestion.create({
    data: { ...toQuestionData(body), testId },
  });
  res.status(201).json({ question });
}

export async function updateCertificateQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = questionInputSchema.parse(req.body);
  const question = await prisma.certificateQuestion.update({
    where: { id },
    data: toQuestionData(body),
  });
  res.json({ question });
}

export async function deleteCertificateQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.certificateQuestion.delete({ where: { id } });
  res.status(204).send();
}

export async function submitCertificateTest(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const { answers } = submitSchema.parse(req.body);

  const test = await prisma.certificateTest.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test || !test.isPublished) throw new HttpError(404, "test not found");

  const summary = gradeCertSubmission(test.questions, answers as SubmittedCertAnswer[]);
  const rasch = computeRaschProxyScore(summary.percentage, summary.totalQuestions);

  const result = await prisma.$transaction(async (tx) => {
    const result = await tx.certificateResult.create({
      data: {
        studentId: req.user!.id,
        testId,
        rawScore: summary.rawScore,
        maxPossible: summary.maxPossible,
        percentage: summary.percentage,
        logit: rasch.logit,
        scaledScore: rasch.scaledScore,
        grade: rasch.grade,
      },
    });
    await tx.certificateAnswer.createMany({
      data: summary.snapshots.map((s) => ({
        ...s,
        resultId: result.id,
        matchItems: s.matchItems ?? Prisma.DbNull,
        selectedMatches: s.selectedMatches ?? Prisma.DbNull,
      })),
    });
    return result;
  });

  res.status(201).json({
    result,
    grade: {
      rawScore: summary.rawScore,
      maxPossible: summary.maxPossible,
      percentage: summary.percentage,
      correctQuestions: summary.correctQuestions,
      totalQuestions: summary.totalQuestions,
      logit: rasch.logit,
      scaledScore: rasch.scaledScore,
      certGrade: rasch.grade,
    },
  });
}

export async function getCertificateResultReview(req: Request, res: Response) {
  const resultId = BigInt(req.params.resultId);
  const result = await prisma.certificateResult.findUnique({
    where: { id: resultId },
    include: {
      test: true,
      answers: { orderBy: { order: "asc" } },
    },
  });
  if (!result) throw new HttpError(404, "result not found");
  if (req.user!.role !== "admin" && result.studentId !== req.user!.id) {
    throw new HttpError(403, "forbidden");
  }

  res.json({ result });
}

export async function getCertificateResults(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const results = await prisma.certificateResult.findMany({
    where: { testId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}

export async function getMyCertificateResults(req: Request, res: Response) {
  const results = await prisma.certificateResult.findMany({
    where: { studentId: req.user!.id },
    include: { test: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}
