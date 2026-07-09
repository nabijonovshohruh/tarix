import { Request, Response } from "express";
import { z } from "zod";
import { CorrectOption } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { buildAnswerSnapshots, gradeSubmission, examStatusFor } from "../services/scoring.service";
import { parseQuestionsWorkbook } from "../services/bulkUpload.service";

const examInputSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive().optional(),
});

const examUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  durationMinutes: z.number().int().positive().nullable().optional(),
  isPublished: z.boolean().optional(),
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

export async function listExams(req: Request, res: Response) {
  const isAdmin = req.user!.role === "admin";
  const includeAll = isAdmin && req.query.all === "true";

  const exams = await prisma.exam.findMany({
    where: includeAll ? {} : { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } },
  });
  res.json({ exams });
}

export async function getExam(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });
  if (!exam) throw new HttpError(404, "exam not found");

  const isAdmin = req.user!.role === "admin";

  // A student who already attempted this exam gets their existing result
  // back so the frontend can lock the exam instead of rendering it again —
  // the strict single-attempt rule is enforced (authoritatively) in
  // submitExam via the studentId+examId unique constraint, this is just so
  // the UI can show the lock message before they even start answering.
  const myResult = isAdmin
    ? null
    : await prisma.examResult.findUnique({
        where: { studentId_examId: { studentId: req.user!.id, examId: id } },
      });

  res.json({
    exam: {
      ...exam,
      questions: isAdmin ? exam.questions : exam.questions.map(stripAnswer),
    },
    myResult,
  });
}

export async function createExam(req: Request, res: Response) {
  const body = examInputSchema.parse(req.body);
  const exam = await prisma.exam.create({ data: body });
  res.status(201).json({ exam });
}

export async function updateExam(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = examUpdateSchema.parse(req.body);
  const exam = await prisma.exam.update({ where: { id }, data: body });
  res.json({ exam });
}

export async function deleteExam(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.exam.delete({ where: { id } });
  res.status(204).send();
}

export async function addExamQuestion(req: Request, res: Response) {
  const examId = BigInt(req.params.id);
  const body = questionInputSchema.parse(req.body);
  const question = await prisma.examQuestion.create({ data: { ...body, examId } });
  res.status(201).json({ question });
}

export async function updateExamQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = questionInputSchema.partial().parse(req.body);
  const question = await prisma.examQuestion.update({ where: { id }, data: body });
  res.json({ question });
}

export async function deleteExamQuestion(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.examQuestion.delete({ where: { id } });
  res.status(204).send();
}

export async function bulkUploadExamQuestions(req: Request, res: Response) {
  const examId = BigInt(req.params.id);
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw new HttpError(404, "exam not found");
  if (!req.file) throw new HttpError(400, "fayl yuborilmadi");

  const { valid, skipped } = await parseQuestionsWorkbook(req.file.buffer);

  const maxOrder = await prisma.examQuestion.aggregate({
    where: { examId },
    _max: { order: true },
  });
  let nextOrder = (maxOrder._max.order ?? 0) + 1;

  if (valid.length > 0) {
    await prisma.examQuestion.createMany({
      data: valid.map((row) => ({ ...row, examId, order: nextOrder++ })),
    });
  }

  res.status(201).json({ inserted: valid.length, skipped });
}

export async function submitExam(req: Request, res: Response) {
  const examId = BigInt(req.params.id);
  const { answers } = submitSchema.parse(req.body);

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });
  if (!exam || !exam.isPublished) throw new HttpError(404, "exam not found");

  const existing = await prisma.examResult.findUnique({
    where: { studentId_examId: { studentId: req.user!.id, examId } },
  });
  if (existing) throw new HttpError(409, "Siz bu imtihonni topshirgansiz!");

  const grade = gradeSubmission(exam.questions, answers);
  const status = examStatusFor(grade.percentage);
  const snapshots = buildAnswerSnapshots(exam.questions, answers);

  const result = await prisma.$transaction(async (tx) => {
    const result = await tx.examResult.create({
      data: {
        studentId: req.user!.id,
        examId,
        score: grade.correct,
        totalQuestions: grade.total,
        percentage: grade.percentage,
        status,
      },
    });
    await tx.examAnswer.createMany({
      data: snapshots.map((s) => ({ ...s, resultId: result.id })),
    });
    return result;
  });

  res.status(201).json({ result, grade });
}

export async function getExamResultReview(req: Request, res: Response) {
  const resultId = BigInt(req.params.resultId);
  const result = await prisma.examResult.findUnique({
    where: { id: resultId },
    include: {
      exam: true,
      answers: { orderBy: { order: "asc" } },
    },
  });
  if (!result) throw new HttpError(404, "result not found");
  if (req.user!.role !== "admin" && result.studentId !== req.user!.id) {
    throw new HttpError(403, "forbidden");
  }

  res.json({ result });
}

export async function getExamResults(req: Request, res: Response) {
  const examId = BigInt(req.params.id);
  const results = await prisma.examResult.findMany({
    where: { examId },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}

export async function getMyExamResults(req: Request, res: Response) {
  const results = await prisma.examResult.findMany({
    where: { studentId: req.user!.id },
    include: { exam: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ results });
}
