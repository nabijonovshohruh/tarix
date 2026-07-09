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

studentsRouter.get("/students/me/dashboard", requireRole("student"), asyncHandler(getMyDashboard));
studentsRouter.get("/students/groups", requireRole("admin"), asyncHandler(getStudentGroups));
studentsRouter.get("/students", requireRole("admin"), asyncHandler(listStudents));
studentsRouter.get("/students/:id", requireRole("admin"), asyncHandler(getStudentDetail));
studentsRouter.patch("/students/:id", requireRole("admin"), asyncHandler(updateStudent));
