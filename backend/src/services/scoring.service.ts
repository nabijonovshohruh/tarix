import { CorrectOption } from "@prisma/client";

export interface GradableQuestion {
  id: bigint;
  correctAnswer: CorrectOption;
}

export interface SnapshotableQuestion {
  id: bigint;
  order: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOption;
  explanation: string | null;
}

export interface SubmittedAnswer {
  questionId: string;
  selectedOption: CorrectOption;
}

export interface GradeResult {
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
}

export function gradeSubmission(
  questions: GradableQuestion[],
  answers: SubmittedAnswer[]
): GradeResult {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));

  let correct = 0;
  for (const q of questions) {
    if (answerMap.get(q.id.toString()) === q.correctAnswer) {
      correct += 1;
    }
  }

  const total = questions.length;
  const wrong = total - correct;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 10000) / 100;

  return { correct, wrong, total, percentage };
}

export interface AnswerSnapshot {
  questionId: bigint;
  order: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOption;
  explanation: string | null;
  selectedOption: CorrectOption | null;
  isCorrect: boolean;
}

/**
 * Denormalized answer snapshots — copies each question's text/options/
 * correctAnswer/explanation as it existed at submission time, so a later
 * edit or deletion of the live question never alters historical review data.
 */
export function buildAnswerSnapshots(
  questions: SnapshotableQuestion[],
  answers: SubmittedAnswer[]
): AnswerSnapshot[] {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedOption]));

  return questions.map((q) => {
    const selectedOption = answerMap.get(q.id.toString()) ?? null;
    return {
      questionId: q.id,
      order: q.order,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      selectedOption,
      isCorrect: selectedOption !== null && selectedOption === q.correctAnswer,
    };
  });
}

export const EXAM_PASS_THRESHOLD = 50;

export function examStatusFor(percentage: number): "PASSED" | "FAILED" {
  return percentage >= EXAM_PASS_THRESHOLD ? "PASSED" : "FAILED";
}
