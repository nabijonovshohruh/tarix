import ExcelJS from "exceljs";
import { prisma } from "../db/prisma";

export async function buildAnalyticsWorkbook(): Promise<ExcelJS.Workbook> {
  const [students, sessions, attendanceRecords, testResults, examResults] = await Promise.all([
    prisma.student.findMany({ orderBy: { fullName: "asc" } }),
    prisma.attendanceSession.findMany({ select: { startTime: true } }),
    prisma.attendanceRecord.findMany({ include: { student: true } }),
    prisma.testResult.findMany({ include: { student: true, test: true }, orderBy: { createdAt: "desc" } }),
    prisma.examResult.findMany({ include: { student: true, exam: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const presentCountByStudent = new Map<string, number>();
  for (const record of attendanceRecords) {
    const key = record.studentId.toString();
    presentCountByStudent.set(key, (presentCountByStudent.get(key) ?? 0) + 1);
  }

  const workbook = new ExcelJS.Workbook();

  const attendanceSheet = workbook.addWorksheet("Davomat");
  attendanceSheet.columns = [
    { header: "Talaba", key: "fullName", width: 28 },
    { header: "Username", key: "username", width: 18 },
    { header: "Jami sessiyalar", key: "totalSessions", width: 16 },
    { header: "Qatnashgan", key: "present", width: 14 },
    { header: "Foiz", key: "percentage", width: 10 },
  ];
  for (const student of students) {
    const present = presentCountByStudent.get(student.id.toString()) ?? 0;
    const total = sessions.filter((s) => s.startTime >= student.createdAt).length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 10000) / 100;
    attendanceSheet.addRow({
      fullName: student.fullName,
      username: student.username ?? "",
      totalSessions: total,
      present,
      percentage,
    });
  }

  const resultsSheet = workbook.addWorksheet("Natijalar");
  resultsSheet.columns = [
    { header: "Talaba", key: "fullName", width: 28 },
    { header: "Turi", key: "type", width: 12 },
    { header: "Nomi", key: "title", width: 32 },
    { header: "Ball (%)", key: "percentage", width: 12 },
    { header: "Holat", key: "status", width: 12 },
    { header: "Sana", key: "date", width: 20 },
  ];
  for (const r of testResults) {
    resultsSheet.addRow({
      fullName: r.student.fullName,
      type: "Test",
      title: r.test.title,
      percentage: r.percentage,
      status: "",
      date: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
    });
  }
  for (const r of examResults) {
    resultsSheet.addRow({
      fullName: r.student.fullName,
      type: "Imtihon",
      title: r.exam.title,
      percentage: r.percentage,
      status: r.status === "PASSED" ? "O'TDI" : "O'TMADI",
      date: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
    });
  }

  for (const sheet of [attendanceSheet, resultsSheet]) {
    sheet.getRow(1).font = { bold: true };
  }

  return workbook;
}
