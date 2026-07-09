import { get, patch } from "./client";
import { DbRole, Student, StudentDashboard } from "./types";

export const getMyDashboard = () => get<{ dashboard: StudentDashboard }>("/students/me/dashboard");

export const listStudents = (q?: string) =>
  get<{ students: Student[] }>(`/students${q ? `?q=${encodeURIComponent(q)}` : ""}`);

export const getStudentGroups = () => get<{ groups: string[] }>("/students/groups");

export const getStudentDetail = (id: string) =>
  get<{ student: Student; dashboard: StudentDashboard }>(`/students/${id}`);

export const updateStudent = (id: string, data: { role: DbRole; groupName: string | null }) =>
  patch<{ student: Student }>(`/students/${id}`, data);
