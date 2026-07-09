import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { upload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";
import {
  listExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  addExamQuestion,
  updateExamQuestion,
  deleteExamQuestion,
  submitExam,
  getExamResults,
  getMyExamResults,
  getExamResultReview,
  bulkUploadExamQuestions,
} from "../controllers/exams.controller";

export const examsRouter = Router();

examsRouter.get("/exam-results/me", requireRole("student"), asyncHandler(getMyExamResults));
examsRouter.get("/exam-results/:resultId/review", asyncHandler(getExamResultReview));

// List browsing stays open to any authenticated role (including guest);
// opening actual content requires paid access.
examsRouter.get("/exams", asyncHandler(listExams));
examsRouter.get("/exams/:id", requireRole("student", "admin"), asyncHandler(getExam));
examsRouter.post("/exams", requireRole("admin"), asyncHandler(createExam));
examsRouter.put("/exams/:id", requireRole("admin"), asyncHandler(updateExam));
examsRouter.delete("/exams/:id", requireRole("admin"), asyncHandler(deleteExam));

examsRouter.post(
  "/exams/:id/questions/bulk-upload",
  requireRole("admin"),
  upload.single("file"),
  asyncHandler(bulkUploadExamQuestions)
);
examsRouter.post("/exams/:id/questions", requireRole("admin"), asyncHandler(addExamQuestion));
examsRouter.put("/exam-questions/:id", requireRole("admin"), asyncHandler(updateExamQuestion));
examsRouter.delete("/exam-questions/:id", requireRole("admin"), asyncHandler(deleteExamQuestion));

examsRouter.post("/exams/:id/submit", requireRole("student"), asyncHandler(submitExam));
examsRouter.get("/exams/:id/results", requireRole("admin"), asyncHandler(getExamResults));
