import { prisma } from "../db/prisma";

type ActivityItem =
  | { type: "test"; id: bigint; testId: bigint; title: string; percentage: number; createdAt: Date }
  | { type: "exam"; id: bigint; examId: bigint; title: string; percentage: number; status: string; createdAt: Date }
  | { type: "attendance"; title: string; createdAt: Date };

export async function getStudentDashboard(studentId: bigint) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });

  const [testResults, examResults, attendanceRecords, sessionsSinceJoined] = await Promise.all([
    prisma.testResult.findMany({
      where: { studentId },
      include: { test: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.examResult.findMany({
      where: { studentId },
      include: { exam: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { session: true },
      orderBy: { createdAt: "desc" },
    }),
    // Only this student's own group's sessions count toward their
    // denominator (plus any legacy ungated ones) — a different group's
    // sessions were never theirs to attend, same scoping as
    // attendance.service.ts's getActiveSession/markAttendance.
    prisma.attendanceSession.count({
      where: {
        startTime: { gte: student.createdAt },
        OR: [{ groupName: null }, { groupName: student.groupName }],
      },
    }),
  ]);

  const testsCompleted = testResults.length;
  const averageScore =
    testsCompleted === 0
      ? 0
      : Math.round(
          (testResults.reduce((sum, r) => sum + r.percentage, 0) / testsCompleted) * 100
        ) / 100;

  // Numerator must be scoped the same way as the denominator above — a
  // record from a session tagged for a group the student has since left
  // (e.g. after being moved between groups) must not count toward their
  // current group's percentage. The unfiltered attendanceRecords list is
  // still used below for the recent-activity timeline, which intentionally
  // shows full history regardless of group.
  const eligibleAttendanceCount = attendanceRecords.filter(
    (r) => r.session.groupName === null || r.session.groupName === student.groupName
  ).length;
  const attendancePercentage =
    sessionsSinceJoined === 0 ? 0 : Math.round((eligibleAttendanceCount / sessionsSinceJoined) * 10000) / 100;

  const activity: ActivityItem[] = [
    ...testResults.map((r) => ({
      type: "test" as const,
      id: r.id,
      testId: r.testId,
      title: r.test.title,
      percentage: r.percentage,
      createdAt: r.createdAt,
    })),
    ...examResults.map((r) => ({
      type: "exam" as const,
      id: r.id,
      examId: r.examId,
      title: r.exam.title,
      percentage: r.percentage,
      status: r.status,
      createdAt: r.createdAt,
    })),
    ...attendanceRecords.map((r) => ({
      type: "attendance" as const,
      title: r.session.title,
      createdAt: r.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  return {
    testsCompleted,
    averageScore,
    attendancePercentage,
    examResults,
    recentActivity: activity,
  };
}
