import { get, post } from "./client";
import { AttendanceRecord, AttendanceSession, SessionRoster } from "./types";

export const startSession = (data: { title: string; durationMinutes: number }) =>
  post<{ session: AttendanceSession }>("/attendance/sessions", data);

export const stopSession = (id: string) =>
  post<{ session: AttendanceSession }>(`/attendance/sessions/${id}/stop`);

export const getActiveSession = () => get<{ session: AttendanceSession | null }>("/attendance/sessions/active");

export const markAttendance = (sessionId: string) =>
  post<{ record: AttendanceRecord }>(`/attendance/sessions/${sessionId}/mark`);

export const listSessions = () => get<{ sessions: AttendanceSession[] }>("/attendance/sessions");

export const getSessionDetail = (id: string) => get<SessionRoster>(`/attendance/sessions/${id}`);

export const getMyAttendance = () => get<{ records: AttendanceRecord[] }>("/attendance/me");
