import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getMyDashboard,
  listStudents,
  getStudentGroups,
  getStudentDetail,
  updateStudent,
} from "../controllers/students.controller";

export const studentsRouter = Router();

// Guests see a reduced (mostly-empty) dashboard under the "Profil" tab
// rather than being blocked outright — getStudentDashboard already degrades
// gracefully to zeros/empty lists for an account with no activity yet.
studentsRouter.get(
  "/students/me/dashboard",
  requireRole("student", "guest"),
  asyncHandler(getMyDashboard)
);
studentsRouter.get("/students/groups", requireRole("admin"), asyncHandler(getStudentGroups));
studentsRouter.get("/students", requireRole("admin"), asyncHandler(listStudents));
studentsRouter.get("/students/:id", requireRole("admin"), asyncHandler(getStudentDetail));
studentsRouter.patch("/students/:id", requireRole("admin"), asyncHandler(updateStudent));
