import { SessionStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";

export async function startSession(title: string, durationMinutes: number) {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  return prisma.attendanceSession.create({
    data: { title, startTime, endTime, status: SessionStatus.ACTIVE },
  });
}

export async function stopSession(sessionId: bigint) {
  return prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.CLOSED, endTime: new Date() },
  });
}

export async function getActiveSession() {
  return prisma.attendanceSession.findFirst({
    where: { status: SessionStatus.ACTIVE, endTime: { gt: new Date() } },
    orderBy: { startTime: "desc" },
  });
}

/**
 * Marks attendance for a student. Independently re-checks now <= endTime
 * regardless of the stored `status` column — this is the authoritative
 * guard that closes the race window before the background poller ticks.
 */
export async function markAttendance(sessionId: bigint, studentId: bigint) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new HttpError(404, "session not found");

  if (session.status !== SessionStatus.ACTIVE || session.endTime.getTime() < Date.now()) {
    throw new HttpError(409, "attendance session is closed");
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { studentId_sessionId: { studentId, sessionId } },
  });
  if (existing) {
    throw new HttpError(409, "attendance already marked for this session");
  }

  return prisma.attendanceRecord.create({ data: { studentId, sessionId } });
}

export async function getSessionRoster(sessionId: bigint) {
  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new HttpError(404, "session not found");

  const [presentRecords, allStudents] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: { student: true },
    }),
    prisma.student.findMany({
      where: { createdAt: { lte: session.startTime } },
    }),
  ]);

  const presentIds = new Set(presentRecords.map((r) => r.studentId.toString()));
  const present = presentRecords.map((r) => r.student);
  const absent = allStudents.filter((s) => !presentIds.has(s.id.toString()));

  const total = allStudents.length;
  const percentage = total === 0 ? 0 : Math.round((present.length / total) * 10000) / 100;

  return { session, present, absent, percentage };
}
