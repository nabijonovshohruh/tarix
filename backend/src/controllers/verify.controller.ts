import { Request, Response } from "express";
import { prisma } from "../db/prisma";

const GRADE_LABELS: Record<string, string> = {
  C: "C",
  C_PLUS: "C+",
  B: "B",
  B_PLUS: "B+",
  A: "A",
  A_PLUS: "A+",
};

// req.params.certificateNumber and student.fullName are both
// attacker-controllable (a student sets their own display name via the
// bot), and this page is public/unauthenticated — every interpolated value
// must be escaped or a crafted name becomes stored XSS against anyone who
// scans the QR code.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; background: #fdfaf2; color: #241c0f; margin: 0; padding: 24px; display: flex; justify-content: center; }
  .card { max-width: 420px; width: 100%; background: #fff; border: 1px solid #e4d7ae; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0ead9; font-size: 14px; }
  .row span:first-child { color: #7a6a45; }
  .row span:last-child { font-weight: 600; text-align: right; }
  .status { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  .status.valid { background: #d8f3e0; color: #1f7a45; }
  .status.expired { background: #fde3e3; color: #a4231d; }
  .status.missing { background: #fde3e3; color: #a4231d; }
  .empty { text-align: center; color: #7a6a45; padding: 24px 0; }
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`;
}

/**
 * Public, unauthenticated verification page for the QR code printed on each
 * certificate PDF — anyone (an employer, another school) scanning it should
 * be able to confirm the certificate is real without a Telegram account or
 * Mini App access. Registered outside the /api prefix and its auth
 * middleware (see app.ts), before the SPA catch-all route.
 */
export async function verifyCertificate(req: Request, res: Response) {
  const certificateNumber = req.params.certificateNumber;
  const safeCertificateNumber = escapeHtml(certificateNumber);

  const result = await prisma.certificateResult.findUnique({
    where: { certificateNumber },
    include: { student: true, test: true },
  });

  if (!result || !result.grade || result.grade === "NONE" || !result.scaledScore) {
    res.status(404).send(
      page(
        "Sertifikat topilmadi",
        `<span class="status missing">Topilmadi</span>
         <h1>Sertifikat topilmadi</h1>
         <p class="empty">"${safeCertificateNumber}" raqamli sertifikat mavjud emas.</p>`
      )
    );
    return;
  }

  const issueDate = result.test.resultsReleasedAt!;
  const expiryDate = new Date(issueDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);
  const isExpired = expiryDate.getTime() < Date.now();

  res.send(
    page(
      `Sertifikat ${safeCertificateNumber}`,
      `<span class="status ${isExpired ? "expired" : "valid"}">${isExpired ? "Muddati o'tgan" : "Amal qiladi"}</span>
       <h1>${safeCertificateNumber}</h1>
       <div class="row"><span>F.I.Sh.</span><span>${escapeHtml(result.student.fullName)}</span></div>
       <div class="row"><span>Fan</span><span>Tarix (O'zbek)</span></div>
       <div class="row"><span>Ball</span><span>${result.scaledScore.toFixed(1)}</span></div>
       <div class="row"><span>Daraja</span><span>${escapeHtml(GRADE_LABELS[result.grade] ?? result.grade)}</span></div>
       <div class="row"><span>Berilgan sanasi</span><span>${formatDate(issueDate)}</span></div>
       <div class="row"><span>Amal qilish muddati</span><span>${formatDate(expiryDate)}</span></div>`
    )
  );
}
