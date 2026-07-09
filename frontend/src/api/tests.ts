import { get, post, postForm, put, del } from "./client";
import { BulkUploadResult, CorrectOption, GradeResult, Period, Question, SubCategory, Test, TestResult } from "./types";

export const listTests = (params?: { period?: Period; subCategory?: SubCategory; all?: boolean }) => {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.subCategory) query.set("subCategory", params.subCategory);
  if (params?.all) query.set("all", "true");
  const qs = query.toString();
  return get<{ tests: Test[] }>(`/tests${qs ? `?${qs}` : ""}`);
};

export const getTest = (id: string) => get<{ test: Test }>(`/tests/${id}`);

export const createTest = (data: { title: string; period: Period; subCategory?: SubCategory | null }) =>
  post<{ test: Test }>("/tests", data);

export const updateTest = (
  id: string,
  data: Partial<{
    title: string;
    period: Period;
    subCategory: SubCategory | null;
    isPublished: boolean;
    isFree: boolean;
  }>
) => put<{ test: Test }>(`/tests/${id}`, data);

export const deleteTest = (id: string) => del(`/tests/${id}`);

export const addQuestion = (
  testId: string,
  data: Omit<Question, "id" | "testId">
) => post<{ question: Question }>(`/tests/${testId}/questions`, data);

export const updateQuestion = (id: string, data: Partial<Omit<Question, "id">>) =>
  put<{ question: Question }>(`/questions/${id}`, data);

export const deleteQuestion = (id: string) => del(`/questions/${id}`);

export const submitTest = (
  testId: string,
  answers: { questionId: string; selectedOption: CorrectOption }[]
) => post<{ result: TestResult; grade: GradeResult }>(`/tests/${testId}/submit`, { answers });

export const getTestResults = (testId: string) => get<{ results: TestResult[] }>(`/tests/${testId}/results`);

export const getMyTestResults = () => get<{ results: TestResult[] }>("/test-results/me");

export const getTestResultReview = (resultId: string) =>
  get<{ result: TestResult }>(`/test-results/${resultId}/review`);

export const bulkUploadQuestions = (testId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return postForm<BulkUploadResult>(`/tests/${testId}/questions/bulk-upload`, formData);
};

export const checkAnswer = (questionId: string, selectedOption: CorrectOption) =>
  post<{ isCorrect: boolean; correctAnswer: CorrectOption }>(`/questions/${questionId}/check`, {
    selectedOption,
  });
