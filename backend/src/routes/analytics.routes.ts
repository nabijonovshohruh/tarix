import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { exportAnalytics } from "../controllers/analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.get("/analytics/export", requireRole("admin"), asyncHandler(exportAnalytics));
