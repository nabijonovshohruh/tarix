import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { CertGrade } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { generateCertificateNumberCandidate } from "../utils/certificateNumber";

const GOLD = "#a9812f";
const CREAM = "#fdfaf2";
const INK = "#241c0f";

const GRADE_LABELS: Record<CertGrade, string> = {
  NONE: "—",
  C: "C",
  C_PLUS: "C+",
  B: "B",
  B_PLUS: "B+",
  A: "A",
  A_PLUS: "A+",
};

export interface CertificatePdfData {
  certificateNumber: string;
  studentDisplayId: string;
  familiya: string;
  ismi: string;
  otasiIsmi: string | null;
  subject: string;
  scaledScore: number;
  percentage: number;
  grade: CertGrade;
  issueDate: Date;
  expiryDate: Date;
  verifyUrl: string;
}

/**
 * Assigns a permanent certificate number to every passing (grade != NONE)
 * result of a test that doesn't already have one — called once right after
 * calibration. Never reassigns an existing number, so re-running calibration
 * (e.g. a late submission comes in) doesn't invalidate certificates already
 * downloaded.
 */
export async function assignCertificateNumbers(testId: bigint): Promise<void> {
  const pending = await prisma.certificateResult.findMany({
    where: { testId, grade: { not: "NONE" }, certificateNumber: null },
  });
  if (pending.length === 0) return;

  const year = new Date().getFullYear();
  for (const result of pending) {
    let candidate: string | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const generated = generateCertificateNumberCandidate(year);
      const existing = await prisma.certificateResult.findUnique({ where: { certificateNumber: generated } });
      if (!existing) {
        candidate = generated;
        break;
      }
    }
    if (!candidate) throw new HttpError(500, "Sertifikat raqamini generatsiya qilib bo'lmadi");
    await prisma.certificateResult.update({ where: { id: result.id }, data: { certificateNumber: candidate } });
  }
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

/**
 * Loads everything needed to render one student's certificate, and enforces
 * the eligibility rules in one place: the test must be released, the result
 * must have a non-NONE grade, and (as a consequence of assignCertificateNumbers
 * only running for passing results) a certificateNumber must exist.
 */
export async function buildCertificatePdfData(resultId: bigint): Promise<CertificatePdfData> {
  const result = await prisma.certificateResult.findUnique({
    where: { id: resultId },
    include: { student: true, test: true },
  });
  if (!result) throw new HttpError(404, "natija topilmadi");
  if (!result.test.resultsReleasedAt) throw new HttpError(403, "Natijalar hali e'lon qilinmagan");
  if (!result.grade || result.grade === "NONE" || !result.certificateNumber || result.scaledScore == null) {
    throw new HttpError(403, "Bu natija uchun sertifikat berilmaydi (o'tish balidan past)");
  }

  const nameParts = result.student.fullName.trim().split(/\s+/);
  const familiya = (nameParts[0] ?? "").toUpperCase();
  const ismi = (nameParts[1] ?? "").toUpperCase();
  const otasiIsmi = nameParts.length > 2 ? nameParts.slice(2).join(" ").toUpperCase() : null;

  const issueDate = result.test.resultsReleasedAt;
  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);

  return {
    certificateNumber: result.certificateNumber,
    studentDisplayId: result.student.id.toString(),
    familiya,
    ismi,
    otasiIsmi,
    subject: "Tarix (O'zbek)",
    scaledScore: result.scaledScore,
    percentage: result.percentage,
    grade: result.grade,
    issueDate,
    expiryDate,
    verifyUrl: `${env.WEBAPP_URL ?? ""}/verify/${encodeURIComponent(result.certificateNumber)}`,
  };
}

/** A faint repeating diamond lattice across the page — a simplified stand-in for the original's woven geometric watermark, kept light enough not to compete with the text. */
function drawLattice(doc: PDFKit.PDFDocument, width: number, height: number) {
  const step = 32;
  doc.save();
  doc.opacity(0.11).strokeColor(GOLD).lineWidth(0.5);
  for (let y = -step; y < height + step; y += step) {
    for (let x = -step; x < width + step; x += step) {
      const offset = (Math.round(y / step) % 2) * (step / 2);
      const cx = x + offset;
      doc
        .moveTo(cx, y - step / 2)
        .lineTo(cx + step / 2, y)
        .lineTo(cx, y + step / 2)
        .lineTo(cx - step / 2, y)
        .closePath()
        .stroke();
    }
  }
  doc.restore();
}

/** One corner's decorative flourish — concentric diamonds fanning out from the corner point, mirrored/rotated per corner via dx/dy sign. */
function drawCornerFlourish(doc: PDFKit.PDFDocument, cornerX: number, cornerY: number, dx: 1 | -1, dy: 1 | -1) {
  doc.save();
  doc.opacity(0.55).strokeColor(GOLD).lineWidth(1);
  for (let i = 1; i <= 5; i++) {
    const size = i * 14;
    doc
      .moveTo(cornerX + dx * size, cornerY)
      .lineTo(cornerX, cornerY + dy * size)
      .stroke();
  }
  doc.restore();
}

/** A generic circular seal (monogram + star) — deliberately not the state emblem, since this is a private course certificate, not a government document. */
function drawSeal(doc: PDFKit.PDFDocument, cx: number, cy: number, radius: number) {
  doc.save();
  doc.lineWidth(1.5).strokeColor(GOLD).circle(cx, cy, radius).stroke();
  doc.lineWidth(0.75).circle(cx, cy, radius - 5).stroke();
  doc.font("Helvetica-Bold").fontSize(radius * 0.7).fillColor(GOLD).text("NS", cx - radius, cy - radius * 0.4, {
    width: radius * 2,
    align: "center",
  });
  doc.restore();
}

export function renderCertificatePdf(data: CertificatePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 0 });
        const chunks: Buffer[] = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 28;
        const contentLeft = margin + 46;
        const contentRight = pageWidth - margin - 46;
        const contentWidth = contentRight - contentLeft;

        doc.rect(0, 0, pageWidth, pageHeight).fill(CREAM);
        drawLattice(doc, pageWidth, pageHeight);

        doc
          .lineWidth(2.5)
          .strokeColor(GOLD)
          .rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
          .stroke();
        doc
          .lineWidth(0.75)
          .strokeColor(GOLD)
          .rect(margin + 7, margin + 7, pageWidth - 2 * (margin + 7), pageHeight - 2 * (margin + 7))
          .stroke();

        drawCornerFlourish(doc, margin + 4, margin + 4, 1, 1);
        drawCornerFlourish(doc, pageWidth - margin - 4, margin + 4, -1, 1);
        drawCornerFlourish(doc, margin + 4, pageHeight - margin - 4, 1, -1);
        drawCornerFlourish(doc, pageWidth - margin - 4, pageHeight - margin - 4, -1, -1);

        let y = margin + 26;
        drawSeal(doc, pageWidth / 2, y + 26, 26);
        y += 62;

        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(INK)
          .text("NABIJONOV SHOHRUH USTOZNING ONLINE KURSLARI HUZURIDAGI", contentLeft, y, {
            width: contentWidth,
            align: "center",
          });
        y = doc.y + 2;
        doc.text("BILIM VA MALAKALARNI SINASH METODI", contentLeft, y, { width: contentWidth, align: "center" });
        y = doc.y + 14;

        doc.moveTo(contentLeft, y).lineTo(contentRight, y).lineWidth(1.25).strokeColor(INK).stroke();
        y += 18;

        doc
          .font("Helvetica-Bold")
          .fontSize(17)
          .text("UMUMTA'LIM FANINI BILISH DARAJASI", contentLeft, y, { width: contentWidth, align: "center" });
        y = doc.y + 2;
        doc.text("TO'G'RISIDA SERTIFIKAT", contentLeft, y, { width: contentWidth, align: "center" });
        y = doc.y + 30;

        const labelX = contentLeft;
        const valueX = contentLeft + 220;
        const rowGap = 22;

        const row = (label: string, value: string, opts?: { valueBold?: boolean }) => {
          doc.font("Helvetica").fontSize(10.5).fillColor(INK).text(label, labelX, y, { width: 210 });
          doc
            .font(opts?.valueBold === false ? "Helvetica" : "Helvetica-Bold")
            .fontSize(10.5)
            .text(value, valueX, y, { width: contentRight - valueX });
          y += rowGap;
        };

        row("Sertifikat raqami:", data.certificateNumber);
        y += 8;
        row("Talabgorning shaxsiy kodi:", data.studentDisplayId);
        row("Familiyasi:", data.familiya);
        row("Ismi:", data.ismi);
        if (data.otasiIsmi) row("Otasining ismi:", data.otasiIsmi);
        y += 8;
        row("Umumta'lim fani:", data.subject);
        row("Umumiy to'plagan bali:", data.scaledScore.toFixed(1));
        row("Umumiy ballga nisbatan foiz ko'rsatkichi:", `${data.percentage} %`);
        row("Sertifikat darajasi:", GRADE_LABELS[data.grade]);
        y += 8;

        doc.font("Helvetica").fontSize(10.5).fillColor(INK).text("Test sinovi natijasi:", labelX, y, { width: 210 });
        doc
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .text(data.scaledScore.toFixed(1), labelX, y, { width: contentWidth, align: "right" });

        // Footer: dates, then QR flanked by the signatory — pinned to the
        // bottom of the page rather than flowing after the fields, so it
        // lands consistently regardless of how many field rows preceded it.
        const footerY = pageHeight - margin - 150;
        doc.moveTo(contentLeft, footerY).lineTo(contentRight, footerY).lineWidth(1).strokeColor(GOLD).stroke();

        const datesY = footerY + 20;
        doc.font("Helvetica").fontSize(10.5).fillColor(INK).text("Berilgan sanasi: ", contentLeft, datesY, {
          continued: true,
        });
        doc.font("Helvetica-Bold").text(formatDate(data.issueDate));

        // Right-aligned label+value pair: `continued: true` combined with
        // `align: "right"` overlaps the two runs instead of concatenating
        // them, so the start x is computed manually from measured widths
        // instead.
        const expiryLabel = "Amal qilish muddati: ";
        const expiryValue = formatDate(data.expiryDate);
        doc.font("Helvetica").fontSize(10.5);
        const expiryLabelWidth = doc.widthOfString(expiryLabel);
        doc.font("Helvetica-Bold").fontSize(10.5);
        const expiryValueWidth = doc.widthOfString(expiryValue);
        const expiryStartX = contentRight - expiryLabelWidth - expiryValueWidth;
        doc.font("Helvetica").fillColor(INK).text(expiryLabel, expiryStartX, datesY, { continued: true });
        doc.font("Helvetica-Bold").text(expiryValue);

        const qrSize = 90;
        const qrX = pageWidth / 2 - qrSize / 2;
        const qrY = footerY + 55;
        const qrBuffer = await QRCode.toBuffer(data.verifyUrl, { type: "png", width: qrSize * 3, margin: 1 });
        doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

        doc
          .font("Helvetica-Bold")
          .fontSize(10.5)
          .fillColor(INK)
          .text("O'qituvchi", contentLeft, qrY + qrSize / 2 - 6, { width: qrX - contentLeft - 10, align: "center" });
        doc.text("SH. NABIJONOV", qrX + qrSize + 10, qrY + qrSize / 2 - 6, {
          width: contentRight - (qrX + qrSize + 10),
          align: "center",
        });

        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor("#8a7a52")
          .text(data.verifyUrl, contentLeft, qrY + qrSize + 6, { width: contentWidth, align: "center" });

        doc.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}
