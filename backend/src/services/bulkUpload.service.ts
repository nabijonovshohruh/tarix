import ExcelJS from "exceljs";
import { CorrectOption } from "@prisma/client";
import { HttpError } from "../middleware/errorHandler";

export interface ParsedQuestionRow {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: CorrectOption;
  explanation?: string;
}

export interface SkippedRow {
  row: number;
  reason: string;
}

const MAX_DATA_ROWS = 500;

function cellText(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value == null) return "";
  return String(cell.value).trim();
}

/**
 * Fixed column layout (no header-name matching): Savol | A | B | C | D |
 * To'g'ri javob | Izoh. Row 1 is always treated as a header and skipped.
 */
export async function parseQuestionsWorkbook(
  buffer: Buffer
): Promise<{ valid: ParsedQuestionRow[]; skipped: SkippedRow[] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's own type defs redeclare a global `Buffer extends ArrayBuffer`,
    // which conflicts with Node's real Buffer type — a real Buffer works fine
    // at runtime, so this is a type-only escape hatch, not a behavior change.
    await workbook.xlsx.load(buffer as any);
  } catch {
    throw new HttpError(400, "Fayl noto'g'ri formatda (.xlsx bo'lishi kerak)");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new HttpError(400, "Fayldan varaq topilmadi");

  const dataRowCount = sheet.rowCount - 1;
  if (dataRowCount > MAX_DATA_ROWS) {
    throw new HttpError(400, `Fayl juda katta (maksimal ${MAX_DATA_ROWS} qator)`);
  }

  const valid: ParsedQuestionRow[] = [];
  const skipped: SkippedRow[] = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const questionText = cellText(row.getCell(1));
    const optionA = cellText(row.getCell(2));
    const optionB = cellText(row.getCell(3));
    const optionC = cellText(row.getCell(4));
    const optionD = cellText(row.getCell(5));
    const correctRaw = cellText(row.getCell(6)).toUpperCase();
    const explanation = cellText(row.getCell(7)) || undefined;

    if (!questionText && !optionA && !optionB && !optionC && !optionD && !correctRaw) {
      continue; // fully blank row — skip silently
    }

    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      skipped.push({ row: rowNumber, reason: "Savol yoki javob variantlaridan biri bo'sh" });
      continue;
    }

    if (!["A", "B", "C", "D"].includes(correctRaw)) {
      skipped.push({ row: rowNumber, reason: "To'g'ri javob ustuni A, B, C yoki D bo'lishi kerak" });
      continue;
    }

    valid.push({
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer: correctRaw as CorrectOption,
      explanation,
    });
  }

  return { valid, skipped };
}
