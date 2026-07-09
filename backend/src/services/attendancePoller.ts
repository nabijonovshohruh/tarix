import { SessionStatus } from "@prisma/client";
import { prisma } from "../db/prisma";

const POLL_INTERVAL_MS = 20_000;

async function closeExpiredSessions() {
  try {
    await prisma.attendanceSession.updateMany({
      where: { status: SessionStatus.ACTIVE, endTime: { lt: new Date() } },
      data: { status: SessionStatus.CLOSED },
    });
  } catch (err) {
    console.error("attendancePoller: failed to sweep expired sessions", err);
  }
}

/**
 * Keeps AttendanceSession.status accurate for list/history views. Not the
 * authoritative guard against late marks — see markAttendance in
 * attendance.service.ts, which independently checks endTime on every mark.
 */
export function startAttendancePoller() {
  const interval = setInterval(closeExpiredSessions, POLL_INTERVAL_MS);
  interval.unref();
  return interval;
}
