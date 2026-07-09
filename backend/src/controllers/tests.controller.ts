import { Request, Response } from "express";
import { z } from "zod";
import { CorrectOption, Period, SubCategory } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { buildAnswerSnapshots, gradeSubmission } from "../services/scoring.service";
import { parseQuestionsWorkbook } from "../services/bulkUpload.service";

// QADIMGI_DUNYO keeps its flat topic list (no sub-category step); every
// other period requires the student to pick O'zbekiston/Jahon tarixi first,
// so a topic assigned to one of those periods must declare which one it
// belongs to.
const testInputSchema = z
  .object({
    title: z.string().min(1),
    period: z.nativeEnum(Period),
    subCategory: z.nativeEnum(SubCategory).nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    subCategory: data.period === "QADIMGI_DUNYO" ? null : data.subCategory ?? null,
  }))
  .refine((data) => data.period === "QADIMGI_DUNYO" || data.subCategory !== null, {
    message: "subCategory is required for this period",
    path: ["subCategory"],
  });

const testUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  period: z.nativeEnum(Period).optional(),
  subCategory: z.nativeEnum(SubCategory).nullable().optional(),
  isPublished: z.boolean().optional(),
  isFree: z.boolean().optional(),
});

const questionInputSchema = z.object({
  questionText: z.string().min(1),
  optionA: z.string().min(1),
  optionB: z.string().min(1),
  optionC: z.string().min(1),
  optionD: z.string().min(1),
  correctAnswer: z.nativeEnum(CorrectOption),
  explanation: z.string().optional(),
  order: z.number().int().optional(),
});

const checkAnswerSchema = z.object({
  selectedOption: z.nativeEnum(CorrectOption),
});

const submitSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOption: z.nativeEnum(CorrectOption),
    })
  ),
});

function stripAnswer<T extends { correctAnswer: CorrectOption; explanation: string | null }>(q: T) {
  const { correctAnswer, explanation, ...rest } = q;
  return rest;
}

/**
 * Guests may only view/solve/check answers for topics marked isFree — every
 * other topic requires student/admin. Enforced here (not just at the route
 * level) since it depends on the specific topic's isFree flag, not just role.
 */
function assertTopicAccess(role: string, test: { isFree: boolean }) {
  if (role === "guest" && !test.isFree) {
    throw new HttpError(403, "this topic is locked");
  }
}

export async function listTests(req: Request, res: Response) {
  const isAdmin = req.user!.role === "admin";
  const includeAll = isAdmin && req.query.all === "true";
  const period = req.query.period as Period | undefined;
  const subCategory = req.query.subCategory as SubCategory | undefined;

  const tests = await prisma.test.findMany({
    where: {
      ...(period ? { period } : {}),
      ...(subCategory ? { subCategory } : {}),
      ...(includeAll ? {} : { isPublished: true }),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });

  res.json({ tests });
}

export async function getTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const test = await prisma.test.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!test) throw new HttpError(404, "test not found");
  assertTopicAccess(req.user!.role, test);

  const isAdmin = req.user!.role === "admin";
  res.json({
    test: {
      ...test,
      questions: isAdmin ? test.questions : test.questions.map(stripAnswer),
    },
  });
}

export async function createTest(req: Request, res: Response) {
  const body = testInputSchema.parse(req.body);
  const test = await prisma.test.create({ data: body });
  res.status(201).json({ test });
}

export async function updateTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = testUpdateSchema.parse(req.body);
  const test = await prisma.test.update({ where: { id }, data: body });
  res.json({ test });
}

export async function deleteTest(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.test.delete({ where: { id } });
  res.status(204).send();
}

export async function addQuestion(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const body = questionInputSchema.parse(req.body);
  const question = await prisma.question.create({ data: { ...body, testId } });
  res.status(201).json({ question });
}

export async function updateQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = questionInputSchema.partial().parse(req.body);
  const question = await prisma.question.update({ where: { id }, data: body });
  res.json({ question });
}

export async function deleteQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.question.delete({ where: { id } });
  res.status(204).send();
}

export async function bulkUploadQuestions(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const test = await prisma.test.findUnique({ where: { id: testId } });
  if (!test) throw new HttpError(404, "test not found");
  if (!req.file) throw new HttpError(400, "fayl yuborilmadi");

  const { valid, skipped } = await parseQuestionsWorkbook(req.file.buffer);

  const maxOrder = await prisma.question.aggregate({
    where: { testId },
    _max: { order: true },
  });
  let nextOrder = (maxOrder._max.order ?? 0) + 1;

  if (valid.length > 0) {
    await prisma.question.createMany({
      data: valid.map((row) => ({ ...row, testId, order: nextOrder++ })),
    });
  }

  res.status(201).json({ inserted: valid.length, skipped });
}

/**
 * Checks a single answer without exposing the full answer key up front —
 * powers instant per-question feedback while a student is still solving the
 * test. Only allowed for published tests unless the requester is an admin.
 */
export async function checkAnswer(req: Request, res: Response) {
  const questionId = BigInt(req.params.id);
  const { selectedOption } = checkAnswerSchema.parse(req.body);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { test: true },
  });
  if (!question) throw new HttpError(404, "question not found");

  const isAdmin = req.user!.role === "admin";
  if (!isAdmin && !question.test.isPublished) throw new HttpError(404, "question not found");
  assertTopicAccess(req.user!.role, question.test);

  res.json({
    isCorrect: selectedOption === question.correctAnswer,
    correctAnswer: question.correctAnswer,
  });
}

export async function submitTest(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const { answers } = submitSchema.parse(req.body);

  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test || !test.isPublished) throw new HttpError(404, "test not found");
  assertTopicAccess(req.user!.role, test);

  const grade = gradeSubmission(test.questions, answers);
  const snapshots = buildAnswerSnapshots(test.questions, answers);

  const result = await prisma.$transaction(async (tx) => {
    const result = await tx.testResult.create({
      data: {
        studentId: req.user!.id,
        testId,
        score: grade.correct,
        percentage: grade.percentage,
      },
    });
    await tx.testAnswer.createMany({
      data: snapshots.map((s) => ({ ...s, resultId: result.id })),
    });
    return result;
  });

  res.status(201).json({ result, grade });
}

export async function getTestResultReview(req: Request, res: Response) {
  const resultId = BigInt(req.params.resultId);
  const result = await prisma.testResult.findUnique({
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

export async function getTestResults(req: Request, res: Response) {
  const testId = BigInt(req.params.id);
  const results = await prisma.testResult.findMany({
    where: { testId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}

export async function getMyTestResults(req: Request, res: Response) {
  const results = await prisma.testResult.findMany({
    where: { studentId: req.user!.id },
    include: { test: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}
