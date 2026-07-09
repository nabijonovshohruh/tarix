import { Request, Response } from "express";
import { buildAnalyticsWorkbook } from "../services/analytics.service";

export async function exportAnalytics(req: Request, res: Response) {
  const workbook = await buildAnalyticsWorkbook();
  const filename = `hisobot-${new Date().toISOString().slice(0, 10)}.xlsx`;

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}
