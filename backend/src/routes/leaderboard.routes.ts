import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { getLeaderboardHandler } from "../controllers/leaderboard.controller";

export const leaderboardRouter = Router();

// Guests are excluded entirely — they must never see or mix with paid
// student group rankings.
leaderboardRouter.get("/leaderboard", requireRole("student", "admin"), asyncHandler(getLeaderboardHandler));
