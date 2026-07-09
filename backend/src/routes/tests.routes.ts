import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  submitTest,
  getTestResults,
  getMyTestResults,
  getTestResultReview,
  bulkUploadQuestions,
  checkAnswer,
} from "../controllers/tests.controller";

export const testsRouter = Router();

testsRouter.get("/test-results/me", asyncHandler(getMyTestResults));
testsRouter.get("/test-results/:resultId/review", asyncHandler(getTestResultReview));

// List browsing stays open to any authenticated role (including guest).
// Opening a specific topic is open to any role too — assertTopicAccess()
// inside the controller enforces isFree for guests (role-only gating can't
// express "allowed only for this specific topic").
testsRouter.get("/tests", asyncHandler(listTests));
testsRouter.get("/tests/:id", asyncHandler(getTest));
testsRouter.post("/tests", requireRole("admin"), asyncHandler(createTest));
testsRouter.put("/tests/:id", requireRole("admin"), asyncHandler(updateTest));
testsRouter.delete("/tests/:id", requireRole("admin"), asyncHandler(deleteTest));

testsRouter.post(
  "/tests/:id/questions/bulk-upload",
  requireRole("admin"),
  upload.single("file"),
  asyncHandler(bulkUploadQuestions)
);
testsRouter.post("/tests/:id/questions", requireRole("admin"), asyncHandler(addQuestion));
testsRouter.put("/questions/:id", requireRole("admin"), asyncHandler(updateQuestion));
testsRouter.delete("/questions/:id", requireRole("admin"), asyncHandler(deleteQuestion));
testsRouter.post("/questions/:id/check", asyncHandler(checkAnswer));

// "student" and "guest" both allowed here — a guest may submit a free
// topic's test as a preview; assertTopicAccess() rejects them on any other
// topic. Admins never submit (unchanged from before).
testsRouter.post("/tests/:id/submit", requireRole("student", "guest"), asyncHandler(submitTest));
testsRouter.get("/tests/:id/results", requireRole("admin"), asyncHandler(getTestResults));
