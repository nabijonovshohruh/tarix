import { get, post, postForm, put, del } from "./client";
import { BulkUploadResult, CorrectOption, Exam, ExamResult, GradeResult, Question, Student } from "./types";

export const listExams = (params?: { all?: boolean }) => {
  const qs = params?.all ? "?all=true" : "";
  return get<{ exams: Exam[] }>(`/exams${qs}`);
};

export const getExam = (id: string) =>
  get<{ exam: Exam; myResult: ExamResult | null }>(`/exams/${id}`);

export const createExam = (data: {
  title: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
}) => post<{ exam: Exam }>("/exams", data);

export const updateExam = (
  id: string,
  data: Partial<{
    title: string;
    durationMinutes: number | null;
    isPublished: boolean;
    startTime: string | null;
    endTime: string | null;
  }>
) => put<{ exam: Exam }>(`/exams/${id}`, data);

export const deleteExam = (id: string) => del(`/exams/${id}`);

export const addExamQuestion = (examId: string, data: Omit<Question, "id" | "examId">) =>
  post<{ question: Question }>(`/exams/${examId}/questions`, data);

export const updateExamQuestion = (id: string, data: Partial<Omit<Question, "id">>) =>
  put<{ question: Question }>(`/exam-questions/${id}`, data);

export const deleteExamQuestion = (id: string) => del(`/exam-questions/${id}`);

export const submitExam = (
  examId: string,
  answers: { questionId: string; selectedOption: CorrectOption }[]
) => post<{ result: ExamResult; grade: GradeResult }>(`/exams/${examId}/submit`, { answers });

export const getExamResults = (examId: string) =>
  get<{ results: ExamResult[]; notParticipated: Student[] }>(`/exams/${examId}/results`);

export const getMyExamResults = () => get<{ results: ExamResult[] }>("/exam-results/me");

export const getExamResultReview = (resultId: string) =>
  get<{ result: ExamResult }>(`/exam-results/${resultId}/review`);

export const bulkUploadExamQuestions = (examId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return postForm<BulkUploadResult>(`/exams/${examId}/questions/bulk-upload`, formData);
};
