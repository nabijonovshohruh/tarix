// Each value is a self-contained grade/subject unit — replaces the old
// 4-era model (QADIMGI_DUNYO/ORTA_ASRLAR/YANGI_DAVR/ENG_YANGI_DAVR).
// QADIMGI_DUNYO was renamed to GRADE_6 in place (see backend migration
// 20260715130000_period_grades_and_editname), preserving all existing tests.
export type Period =
  | "GRADE_6"
  | "GRADE_7_JAHON"
  | "GRADE_7_UZBEKISTON"
  | "GRADE_8_JAHON"
  | "GRADE_8_UZBEKISTON"
  | "GRADE_9_JAHON"
  | "GRADE_9_UZBEKISTON"
  | "GRADE_10_JAHON"
  | "GRADE_10_UZBEKISTON"
  | "GRADE_11_JAHON"
  | "GRADE_11_UZBEKISTON";
// Legacy field, no longer set/used by the app (see Period above).
export type SubCategory = "UZBEKISTON" | "JAHON";
export type MaterialSection = "DARSLIKLAR" | "MUHIM_QOLLANMALAR" | "UMUMIY_SERTIFIKAT" | "MAVZULASHGAN_SERTIFIKAT";
// Only meaningful when section is MAVZULASHGAN_SERTIFIKAT — same
// relationship as Period/SubCategory (see backend schema comment).
export type MaterialSubSection =
  | "GRADE_6"
  | "GRADE_7_JAHON"
  | "GRADE_7_UZBEKISTON"
  | "GRADE_8_JAHON"
  | "GRADE_8_UZBEKISTON"
  | "GRADE_9_JAHON"
  | "GRADE_9_UZBEKISTON"
  | "GRADE_10_JAHON"
  | "GRADE_10_UZBEKISTON"
  | "GRADE_11_JAHON"
  | "GRADE_11_UZBEKISTON";
// Pure UI grouping — each MaterialSection value belongs to exactly one of
// these two top-level categories (see backend/prisma/schema.prisma's comment
// on the MaterialSection enum).
export type MaterialCategory = "GUIDES" | "CERTIFICATES";
export type CorrectOption = "A" | "B" | "C" | "D";
export type SessionStatus = "ACTIVE" | "CLOSED";
export type ExamStatus = "PASSED" | "FAILED";
export type Role = "guest" | "student" | "admin";
// Raw Student.role wire value (as returned by /students* admin endpoints and
// expected by PATCH /students/:id) — matches the Prisma Role enum directly,
// distinct from the lowercase Role used for the authenticated user above.
export type DbRole = "GUEST" | "STUDENT" | "ADMIN";

export interface AuthUser {
  id: string;
  telegramId: string;
  fullName: string;
  username?: string | null;
  role: Role;
  groupName?: string | null;
  isRegistered: boolean;
  channelSubscribed: boolean;
}

export interface Student {
  id: string;
  telegramId: string;
  fullName: string;
  username?: string | null;
  role: DbRole;
  groupName?: string | null;
  isRegistered: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  testId?: string;
  examId?: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer?: CorrectOption;
  explanation?: string | null;
  order: number;
}

export interface Test {
  id: string;
  title: string;
  period: Period;
  subCategory: SubCategory | null;
  isPublished: boolean;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  _count?: { questions: number };
}

export interface AnswerSnapshot {
  id: string;
  order: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOption;
  explanation?: string | null;
  selectedOption: CorrectOption | null;
  isCorrect: boolean;
}

export interface TestResult {
  id: string;
  studentId: string;
  student?: Student;
  testId: string;
  test?: Test;
  score: number;
  percentage: number;
  createdAt: string;
  answers?: AnswerSnapshot[];
}

export interface Exam {
  id: string;
  title: string;
  isPublished: boolean;
  durationMinutes?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  createdAt: string;
  updatedAt: string;
  questions?: Question[];
  _count?: { questions: number };
}

export interface ExamResult {
  id: string;
  studentId: string;
  student?: Student;
  examId: string;
  exam?: Exam;
  score: number;
  totalQuestions: number;
  percentage: number;
  status: ExamStatus;
  createdAt: string;
  answers?: AnswerSnapshot[];
}

export interface AttendanceSession {
  id: string;
  title: string;
  groupName: string | null;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  createdAt: string;
  _count?: { records: number };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  student?: Student;
  sessionId: string;
  session?: AttendanceSession;
  createdAt: string;
}

export interface SessionRoster {
  session: AttendanceSession;
  present: Student[];
  absent: Student[];
  percentage: number;
}

export interface GradeResult {
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
}

export interface ActivityItem {
  type: "test" | "exam" | "attendance";
  id?: string;
  testId?: string;
  examId?: string;
  title: string;
  percentage?: number;
  status?: ExamStatus;
  createdAt: string;
}

export interface StudentDashboard {
  testsCompleted: number;
  averageScore: number;
  attendancePercentage: number;
  examResults: ExamResult[];
  recentActivity: ActivityItem[];
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  fullName: string;
  combinedScore: number;
  averagePercentage: number;
  attendancePercentage: number;
}

// List items never include description/fileId — see materials.controller.ts's
// listMaterials for why. MaterialDetail below is the full shape used once a
// single material is fetched.
export interface Material {
  id: string;
  title: string;
  section: MaterialSection;
  subSection: MaterialSubSection | null;
  isPremium: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialDetail extends Material {
  description: string;
}

export interface BulkUploadResult {
  inserted: number;
  skipped: { row: number; reason: string }[];
}

// National Certificate ("Milliy Sertifikat") interactive test: 45 questions
// across three types (Q1-32 MCQ, Q33-35 single-answer A-F, Q36-45 open a/b),
// accessed by a short teacher-shared code rather than browsing — see
// backend/prisma/schema.prisma's CertificateTest family and
// certificates.controller.ts's code-access flow.
export type CertQuestionType = "MCQ" | "MATCHING" | "OPEN";
export type CertGrade = "NONE" | "C" | "C_PLUS" | "B" | "B_PLUS" | "A" | "A_PLUS";
// Q33-35 ("MATCHING") per the official exam format are single-answer
// questions with 6 options (A-F), unlike MCQ's 4 (A-D) — deliberately
// distinct from CorrectOption, mirroring the backend's Prisma
// MatchAnswerOption enum.
export type MatchOption = "A" | "B" | "C" | "D" | "E" | "F";

// Full admin-facing question shape (answer keys included).
export interface CertificateQuestion {
  id: string;
  testId?: string;
  type: CertQuestionType;
  order: number;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: CorrectOption | null;
  matchAnswer?: MatchOption | null;
  openLabelA?: string | null;
  openAnswerA?: string | null;
  openLabelB?: string | null;
  openAnswerB?: string | null;
  explanation?: string | null;
  maxPoints?: number;
}

export interface CertificateTest {
  id: string;
  title: string;
  testCode: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: CertificateQuestion[];
  _count?: { questions: number };
}

// The pure "digital answer sheet" shape returned by the test-code access
// endpoint — no question text, no option text, no answer keys, just enough
// structure to render the right input per question. MATCHING needs nothing
// beyond the type discriminant (rendered like MCQ, just with A-F buttons).
export interface CertAnswerSheetQuestion {
  id: string;
  order: number;
  type: CertQuestionType;
  openLabelA?: string | null;
  openLabelB?: string | null;
}

export interface CertAnswerSheetTest {
  id: string;
  title: string;
  questions: CertAnswerSheetQuestion[];
}

export interface CertSubmittedAnswer {
  questionId: string;
  selectedOption?: CorrectOption;
  selectedMatchAnswer?: MatchOption;
  answerA?: string;
  answerB?: string;
}

export interface CertGradeSummary {
  rawScore: number;
  maxPossible: number;
  percentage: number;
  correctQuestions: number;
  totalQuestions: number;
  logit: number;
  scaledScore: number;
  certGrade: CertGrade;
}

export interface CertificateResult {
  id: string;
  studentId: string;
  student?: Student;
  testId: string;
  test?: CertificateTest;
  rawScore: number;
  maxPossible: number;
  percentage: number;
  logit: number;
  scaledScore: number;
  grade: CertGrade;
  createdAt: string;
}
