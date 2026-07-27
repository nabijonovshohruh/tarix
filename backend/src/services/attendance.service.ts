import { SessionStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";

export async function startSession(title: string, durationMinutes: number, groupName: string) {
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  return prisma.attendanceSession.create({
    data: { title, startTime, endTime, status: SessionStatus.ACTIVE, groupName },
  });
}

export async function stopSession(sessionId: bigint) {
  return prisma.attendanceSession.update({
    where: { id: sessionId },
    data: { status: SessionStatus.CLOSED, endTime: new Date() },
  });
}

/**
 * forGroupName is omitted entirely for admins (they need to see/manage
 * whatever session is running regardless of which group it's for). For a
 * student/guest it's their own groupName (or null) — only a session that's
 * ungated (legacy, groupName null) or tagged for their exact group counts as
 * "active" for them, so they never see a session they structurally can't
 * mark attendance for.
 */
export async function getActiveSession(forGroupName?: string | null) {
  return prisma.attendanceSession.findFirst({
    where: {
      status: SessionStatus.ACTIVE,
      endTime: { gt: new Date() },
      ...(forGroupName !== undefined ? { OR: [{ groupName: null }, { groupName: forGroupName }] } : {}),
    },
    orderBy: { startTime: "desc" },
  });
}

/**
 * Marks attendance for a student. Independently re-checks now <= endTime
 * regardless of the stored `status` column — this is the authoritative
 * guard that closes the race window before the background poller ticks.
 */
export async function markAttendance(sessionId: bigint, studentId: bigint) {
  // "Konkurs" is a competition-only group with no attendance obligation —
  // restricted from marking attendance entirely, per the teacher's request.
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (student?.groupName === "Konkurs") {
    throw new HttpError(403, "Kechirasiz, sizning guruhingiz uchun davomat bo'limi mavjud emas.");
  }

  const session = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new HttpError(404, "session not found");

  // A session tagged for a specific group only accepts attendance from that
  // group's students — a group-A student can't mark a group-B session.
  // Ungated (legacy, groupName null) sessions stay open to everyone.
  if (session.groupName && student?.groupName !== session.groupName) {
    throw new HttpError(403, "Bu davomat sessiyasi sizning guruhingiz uchun emas.");
  }

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
    // Only paid/enrolled students count toward the roster — guests (and
    // admins) are never expected to attend and shouldn't pad the "absent"
    // list or skew the attendance percentage. A group-tagged session is
    // further scoped to just that group's students; an ungated (legacy)
    // session falls back to every STUDENT-role row, as before.
    prisma.student.findMany({
      where: {
        role: "STUDENT",
        createdAt: { lte: session.startTime },
        ...(session.groupName ? { groupName: session.groupName } : {}),
      },
    }),
  ]);

  const presentIds = new Set(presentRecords.map((r) => r.studentId.toString()));
  const present = presentRecords.map((r) => r.student);
  const absent = allStudents.filter((s) => !presentIds.has(s.id.toString()));

  const total = allStudents.length;
  const percentage = total === 0 ? 0 : Math.round((present.length / total) * 10000) / 100;

  return { session, present, absent, percentage };
}
