import { Router } from "express";
import { requireRole } from "../middleware/requireRole";
import { asyncHandler } from "../utils/asyncHandler";
import { getLeaderboardHandler } from "../controllers/leaderboard.controller";

export const leaderboardRouter = Router();

// Guests are allowed alongside students/admin — see
// getLeaderboardHandler's role branch: a guest has no groupName (they were
// never assigned to a paid class group), so they get the same empty board a
// group-less student would, never another group's rankings.
leaderboardRouter.get(
  "/leaderboard",
  requireRole("student", "admin", "guest"),
  asyncHandler(getLeaderboardHandler)
);
