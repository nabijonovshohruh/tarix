import { get, post, put, del } from "./client";
import {
  CalibrationSummary,
  CertAnswerSheetTest,
  CertificateQuestion,
  CertificateResult,
  CertificateTest,
  CertSubmittedAnswer,
  CorrectOption,
  MatchOption,
} from "./types";

export const listCertificateTests = () => get<{ tests: CertificateTest[] }>("/certificate-tests");

export const getCertificateTest = (id: string) =>
  get<{ test: CertificateTest; accessLink: string | null }>(`/certificate-tests/${id}`);

export const createCertificateTest = (title: string) =>
  post<{ test: CertificateTest; accessLink: string | null }>("/certificate-tests", { title });

export const updateCertificateTest = (id: string, data: Partial<{ title: string; isPublished: boolean }>) =>
  put<{ test: CertificateTest }>(`/certificate-tests/${id}`, data);

export const deleteCertificateTest = (id: string) => del(`/certificate-tests/${id}`);

export type CertQuestionInput =
  | {
      type: "MCQ";
      questionText: string;
      order?: number;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: CorrectOption;
    }
  | {
      // Q33-35: a single-answer question with 6 options (A-F), not a
      // multi-pair matching table — see backend's MatchAnswerOption.
      type: "MATCHING";
      questionText: string;
      order?: number;
      matchAnswer: MatchOption;
    }
  | {
      type: "OPEN";
      questionText: string;
      order?: number;
      openLabelA?: string;
      openAnswerA: string;
      openLabelB?: string;
      openAnswerB?: string;
    };

export const addCertificateQuestion = (testId: string, data: CertQuestionInput) =>
  post<{ question: CertificateQuestion }>(`/certificate-tests/${testId}/questions`, data);

export const deleteCertificateQuestion = (id: string) => del(`/certificate-questions/${id}`);

// Student entry point: trade the teacher-shared PIN for the stripped
// digital answer sheet (see backend accessCertificateTestByCode).
export const accessCertificateTestByCode = (code: string) =>
  post<{ test: CertAnswerSheetTest }>("/certificate-tests/access", { code });

// No grade/score is returned here — results are hidden until the admin
// calibrates and releases the whole test (see calibrateCertificateResults).
export const submitCertificateTest = (testId: string, answers: CertSubmittedAnswer[]) =>
  post<{ result: CertificateResult }>(`/certificate-tests/${testId}/submit`, { answers });

export const getMyCertificateResults = () => get<{ results: CertificateResult[] }>("/certificate-results/me");

export const getCertificateResultReview = (resultId: string) =>
  get<{ result: CertificateResult }>(`/certificate-results/${resultId}/review`);

export const getCertificateResults = (testId: string) =>
  get<{ results: CertificateResult[] }>(`/certificate-tests/${testId}/results`);

export const calibrateCertificateResults = (testId: string) =>
  post<{ summary: CalibrationSummary }>(`/certificate-tests/${testId}/calibrate`);
