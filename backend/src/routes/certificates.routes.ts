import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listCertificateTests,
  getCertificateTest,
  createCertificateTest,
  updateCertificateTest,
  deleteCertificateTest,
  addCertificateQuestion,
  updateCertificateQuestion,
  deleteCertificateQuestion,
  accessCertificateTestByCode,
  submitCertificateTest,
  getCertificateResults,
  getMyCertificateResults,
  getCertificateResultReview,
  calibrateAndReleaseCertificateResults,
  deliverCertificatePdf,
} from "../controllers/certificates.controller";

export const certificatesRouter = Router();

// No role requirement on any of these three — Certificate Test is open to
// every bot user (guest included), not just promoted "student" accounts.
// Ownership is still enforced inside the controllers via req.user!.id.
certificatesRouter.get("/certificate-results/me", asyncHandler(getMyCertificateResults));
certificatesRouter.get(
  "/certificate-results/:resultId/review",
  asyncHandler(getCertificateResultReview)
);
certificatesRouter.post(
  "/certificate-results/:resultId/certificate",
  asyncHandler(deliverCertificatePdf)
);

// Students never browse or open a test by id — the only entry point is the
// test-code access flow below. Listing/opening by id is admin-only, for
// managing the question bank and reading back each test's code.
certificatesRouter.get("/certificate-tests", requireRole("admin"), asyncHandler(listCertificateTests));
certificatesRouter.get(
  "/certificate-tests/:id",
  requireRole("admin"),
  asyncHandler(getCertificateTest)
);
certificatesRouter.post("/certificate-tests/access", asyncHandler(accessCertificateTestByCode));
certificatesRouter.post(
  "/certificate-tests",
  requireRole("admin"),
  asyncHandler(createCertificateTest)
);
certificatesRouter.put(
  "/certificate-tests/:id",
  requireRole("admin"),
  asyncHandler(updateCertificateTest)
);
certificatesRouter.delete(
  "/certificate-tests/:id",
  requireRole("admin"),
  asyncHandler(deleteCertificateTest)
);

certificatesRouter.post(
  "/certificate-tests/:id/questions",
  requireRole("admin"),
  asyncHandler(addCertificateQuestion)
);
certificatesRouter.put(
  "/certificate-questions/:id",
  requireRole("admin"),
  asyncHandler(updateCertificateQuestion)
);
certificatesRouter.delete(
  "/certificate-questions/:id",
  requireRole("admin"),
  asyncHandler(deleteCertificateQuestion)
);

certificatesRouter.post("/certificate-tests/:id/submit", asyncHandler(submitCertificateTest));
certificatesRouter.get(
  "/certificate-tests/:id/results",
  requireRole("admin"),
  asyncHandler(getCertificateResults)
);
certificatesRouter.post(
  "/certificate-tests/:id/calibrate",
  requireRole("admin"),
  asyncHandler(calibrateAndReleaseCertificateResults)
);
