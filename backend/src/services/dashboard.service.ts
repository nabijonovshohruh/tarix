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
    prisma.attendanceSession.count({
      where: { startTime: { gte: student.createdAt } },
    }),
  ]);

  const testsCompleted = testResults.length;
  const averageScore =
    testsCompleted === 0
      ? 0
      : Math.round(
          (testResults.reduce((sum, r) => sum + r.percentage, 0) / testsCompleted) * 100
        ) / 100;

  const attendancePercentage =
    sessionsSinceJoined === 0
      ? 0
      : Math.round((attendanceRecords.length / sessionsSinceJoined) * 10000) / 100;

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
