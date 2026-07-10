export type Period = "QADIMGI_DUNYO" | "ORTA_ASRLAR" | "YANGI_DAVR" | "ENG_YANGI_DAVR";
export type SubCategory = "UZBEKISTON" | "JAHON";
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

export interface BulkUploadResult {
  inserted: number;
  skipped: { row: number; reason: string }[];
}
