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
  submitCertificateTest,
  getCertificateResults,
  getMyCertificateResults,
  getCertificateResultReview,
} from "../controllers/certificates.controller";

export const certificatesRouter = Router();

certificatesRouter.get(
  "/certificate-results/me",
  requireRole("student"),
  asyncHandler(getMyCertificateResults)
);
certificatesRouter.get(
  "/certificate-results/:resultId/review",
  asyncHandler(getCertificateResultReview)
);

// List browsing stays open to any authenticated role, same as tests/exams;
// opening/submitting a specific certificate test is restricted to
// student/admin — unlike Test, there is no guest free-preview tier here.
certificatesRouter.get("/certificate-tests", asyncHandler(listCertificateTests));
certificatesRouter.get(
  "/certificate-tests/:id",
  requireRole("student", "admin"),
  asyncHandler(getCertificateTest)
);
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

certificatesRouter.post(
  "/certificate-tests/:id/submit",
  requireRole("student"),
  asyncHandler(submitCertificateTest)
);
certificatesRouter.get(
  "/certificate-tests/:id/results",
  requireRole("admin"),
  asyncHandler(getCertificateResults)
);
