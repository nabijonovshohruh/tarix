import { prisma } from "../db/prisma";

const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Monday 00:00 in a fixed UTC+5 (Asia/Tashkent, no DST) offset, as a UTC Date. */
function getWeekStart(): Date {
  const now = new Date();
  const tashkentNow = new Date(now.getTime() + TASHKENT_OFFSET_MS);
  const day = tashkentNow.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (day + 6) % 7;
  const tashkentMidnight = Date.UTC(
    tashkentNow.getUTCFullYear(),
    tashkentNow.getUTCMonth(),
    tashkentNow.getUTCDate() - daysSinceMonday,
    0,
    0,
    0,
    0
  );
  return new Date(tashkentMidnight - TASHKENT_OFFSET_MS);
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  fullName: string;
  combinedScore: number;
  averagePercentage: number;
  attendancePercentage: number;
}

/**
 * combinedScore = 70% pooled average test+exam percentage + 30% attendance
 * percentage. Students with zero activity in the selected window are
 * excluded rather than padding the board with meaningless 0% rows.
 */
export async function getLeaderboard(
  window: "all" | "week",
  groupName: string
): Promise<LeaderboardEntry[]> {
  const weekStart = window === "week" ? getWeekStart() : null;

  const [students, sessions, testAgg, examAgg, attendanceAgg] = await Promise.all([
    // Scoped to one paid group so guests and other batches never mix into
    // this ranking — every downstream lookup below only ever iterates this
    // filtered list, so no other query needs its own groupName filter.
    prisma.student.findMany({
      where: { role: "STUDENT", groupName },
      select: { id: true, fullName: true, createdAt: true },
    }),
    prisma.attendanceSession.findMany({ select: { startTime: true } }),
    prisma.testResult.groupBy({
      by: ["studentId"],
      _sum: { percentage: true },
      _count: true,
      where: weekStart ? { createdAt: { gte: weekStart } } : undefined,
      orderBy: { studentId: "asc" },
    }),
    prisma.examResult.groupBy({
      by: ["studentId"],
      _sum: { percentage: true },
      _count: true,
      where: weekStart ? { createdAt: { gte: weekStart } } : undefined,
      orderBy: { studentId: "asc" },
    }),
    prisma.attendanceRecord.groupBy({
      by: ["studentId"],
      _count: true,
      where: weekStart ? { session: { startTime: { gte: weekStart } } } : undefined,
      orderBy: { studentId: "asc" },
    }),
  ]);

  const testMap = new Map(testAgg.map((t) => [t.studentId.toString(), t]));
  const examMap = new Map(examAgg.map((e) => [e.studentId.toString(), e]));
  const attendanceMap = new Map(attendanceAgg.map((a) => [a.studentId.toString(), a._count]));

  const entries: Omit<LeaderboardEntry, "rank">[] = [];

  for (const student of students) {
    const key = student.id.toString();
    const t = testMap.get(key);
    const e = examMap.get(key);

    const sumPercentage = (t?._sum.percentage ?? 0) + (e?._sum.percentage ?? 0);
    const count = (t?._count ?? 0) + (e?._count ?? 0);
    const averagePercentage = count === 0 ? 0 : Math.round((sumPercentage / count) * 100) / 100;

    const sessionFloor = weekStart && weekStart > student.createdAt ? weekStart : student.createdAt;
    const denom = sessions.filter((s) => s.startTime >= sessionFloor).length;
    const present = attendanceMap.get(key) ?? 0;
    const attendancePercentage = denom === 0 ? 0 : Math.round((present / denom) * 10000) / 100;

    if (count === 0 && present === 0) continue; // no activity in this window

    const combinedScore = Math.round((0.7 * averagePercentage + 0.3 * attendancePercentage) * 100) / 100;

    entries.push({
      studentId: key,
      fullName: student.fullName,
      combinedScore,
      averagePercentage,
      attendancePercentage,
    });
  }

  entries.sort((a, b) => b.combinedScore - a.combinedScore);

  return entries.slice(0, 10).map((entry, i) => ({ ...entry, rank: i + 1 }));
}
