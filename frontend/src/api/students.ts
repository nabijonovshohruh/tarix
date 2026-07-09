import { get, patch } from "./client";
import { DbRole, Student, StudentDashboard } from "./types";

export const getMyDashboard = () => get<{ dashboard: StudentDashboard }>("/students/me/dashboard");

export const listStudents = (q?: string, role?: DbRole) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role) params.set("role", role);
  const qs = params.toString();
  return get<{ students: Student[] }>(`/students${qs ? `?${qs}` : ""}`);
};

export const getStudentGroups = () => get<{ groups: string[] }>("/students/groups");

export const getStudentDetail = (id: string) =>
  get<{ student: Student; dashboard: StudentDashboard }>(`/students/${id}`);

export const updateStudent = (id: string, data: { role: DbRole; groupName: string | null }) =>
  patch<{ student: Student }>(`/students/${id}`, data);
