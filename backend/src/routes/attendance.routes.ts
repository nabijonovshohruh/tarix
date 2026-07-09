import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import {
  postStartSession,
  postStopSession,
  getActive,
  postMark,
  listSessions,
  getSessionDetail,
  getMyAttendance,
} from "../controllers/attendance.controller";

export const attendanceRouter = Router();

attendanceRouter.get("/attendance/me", requireRole("student"), asyncHandler(getMyAttendance));
attendanceRouter.get("/attendance/sessions/active", asyncHandler(getActive));
attendanceRouter.get("/attendance/sessions", requireRole("admin"), asyncHandler(listSessions));
attendanceRouter.get("/attendance/sessions/:id", requireRole("admin"), asyncHandler(getSessionDetail));
attendanceRouter.post("/attendance/sessions", requireRole("admin"), asyncHandler(postStartSession));
attendanceRouter.post("/attendance/sessions/:id/stop", requireRole("admin"), asyncHandler(postStopSession));
attendanceRouter.post("/attendance/sessions/:id/mark", requireRole("student"), asyncHandler(postMark));
