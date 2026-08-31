import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { CertGrade } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { GRADE_BANDS } from "./certificateScoring.service";
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

/**
 * The certificate's "percentage relative to overall score" field is a
 * national-standard display value, not the raw test-correctness percentage
 * (result.percentage) — it's derived from the calibrated scaledScore
 * against the "A" grade threshold: A/A+ always show a flat 100%, anything
 * below is the proportion of the way to that threshold. (Verified against
 * the reference certificate: scaledScore 60.7 / A-threshold 65 * 100 =
 * 93.38%, exactly matching its printed "93.38 %".)
 */
function computeCertificatePercentage(scaledScore: number, grade: CertGrade): number {
  if (grade === "A" || grade === "A_PLUS") return 100;
  const aThreshold = GRADE_BANDS.find((band) => band.grade === "A")!.min;
  const raw = (scaledScore / aThreshold) * 100;
  return Math.round(Math.min(100, raw) * 100) / 100;
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
    percentage: computeCertificatePercentage(result.scaledScore, result.grade),
    grade: result.grade,
    issueDate,
    expiryDate,
    verifyUrl: `${env.WEBAPP_URL ?? ""}/verify/${encodeURIComponent(result.certificateNumber)}`,
  };
}

/**
 * One tile of the interlocking-star weave: a diamond (45°-rotated square)
 * plus a smaller axis-aligned square sharing the same center, whose
 * overlapping edges read as an 8-pointed star — the classic Islamic
 * geometric motif this style of certificate border is built from — using
 * only straight strokes, no curves or raster assets needed.
 */
function drawStarTile(doc: PDFKit.PDFDocument, cx: number, cy: number, r: number) {
  doc
    .moveTo(cx, cy - r)
    .lineTo(cx + r, cy)
    .lineTo(cx, cy + r)
    .lineTo(cx - r, cy)
    .closePath()
    .stroke();
  const s = r * 0.72;
  doc
    .moveTo(cx - s, cy - s)
    .lineTo(cx + s, cy - s)
    .lineTo(cx + s, cy + s)
    .lineTo(cx - s, cy + s)
    .closePath()
    .stroke();
}

/**
 * Tiles drawStarTile across a rectangular region in a diamond (offset-row)
 * grid, with short connector strokes between neighboring tile centers so
 * the pattern reads as one continuous woven lattice rather than isolated
 * floating stars — this is what both the full-page watermark and the
 * denser corner ornaments are built from, just at different step/opacity.
 */
function drawStarWeave(
  doc: PDFKit.PDFDocument,
  region: { x: number; y: number; width: number; height: number },
  step: number,
  opacity: number
) {
  doc.save();
  doc.opacity(opacity).strokeColor(GOLD).lineWidth(0.5);
  const half = step / 2;
  const r = step * 0.36;
  for (let y = region.y - step; y < region.y + region.height + step; y += half) {
    const row = Math.round((y - region.y) / half);
    const rowOffset = row % 2 === 0 ? 0 : half;
    for (let x = region.x - step + rowOffset; x < region.x + region.width + step; x += step) {
      drawStarTile(doc, x, y, r);
      // Connectors to the tile directly right and directly below-right,
      // in this offset grid — enough to visually link the whole weave
      // without doubling every edge.
      doc
        .moveTo(x + r, y)
        .lineTo(x + step - r, y)
        .stroke();
      doc
        .moveTo(x + half - r * 0.7, y + half - r * 0.7)
        .lineTo(x + half + r * 0.7, y + half + r * 0.7)
        .stroke();
    }
  }
  doc.restore();
}

/** The full-page background watermark — light enough to stay behind all text. */
function drawPageWeave(doc: PDFKit.PDFDocument, width: number, height: number) {
  drawStarWeave(doc, { x: 0, y: 0, width, height }, 34, 0.09);
}

/**
 * A denser echo of the same weave, clipped to a right-triangle in one
 * corner, mirrored per corner via dx/dy — this is the "heavier" decorative
 * corner block seen on the reference certificate, built from the identical
 * motif as the page-wide watermark rather than a separate one-off graphic.
 */
function drawCornerOrnament(doc: PDFKit.PDFDocument, cornerX: number, cornerY: number, dx: 1 | -1, dy: 1 | -1, size: number) {
  doc.save();
  doc
    .moveTo(cornerX, cornerY)
    .lineTo(cornerX + dx * size, cornerY)
    .lineTo(cornerX, cornerY + dy * size)
    .closePath()
    .clip();
  const regionX = dx === 1 ? cornerX : cornerX - size;
  const regionY = dy === 1 ? cornerY : cornerY - size;
  drawStarWeave(doc, { x: regionX, y: regionY, width: size, height: size }, 20, 0.4);
  doc.restore();
}

/** A generic circular medallion seal (monogram + tick-mark rim) — deliberately not the state emblem, since this is a private course certificate, not a government document. */
function drawSeal(doc: PDFKit.PDFDocument, cx: number, cy: number, radius: number) {
  doc.save();
  doc.lineWidth(1.5).strokeColor(GOLD).circle(cx, cy, radius).stroke();
  doc.lineWidth(0.75).circle(cx, cy, radius - 6).stroke();

  // Tick marks around the rim, like a coin/medallion edge.
  const tickCount = 24;
  for (let i = 0; i < tickCount; i++) {
    const angle = (i / tickCount) * Math.PI * 2;
    const inner = radius - 2;
    const outer = radius + 3;
    doc
      .moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
      .lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
      .stroke();
  }

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
        drawPageWeave(doc, pageWidth, pageHeight);

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

        const cornerSize = 150;
        drawCornerOrnament(doc, margin + 4, margin + 4, 1, 1, cornerSize);
        drawCornerOrnament(doc, pageWidth - margin - 4, margin + 4, -1, 1, cornerSize);
        drawCornerOrnament(doc, margin + 4, pageHeight - margin - 4, 1, -1, cornerSize);
        drawCornerOrnament(doc, pageWidth - margin - 4, pageHeight - margin - 4, -1, -1, cornerSize);

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
