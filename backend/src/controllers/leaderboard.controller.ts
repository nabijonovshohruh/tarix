import { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../middleware/errorHandler";
import { getLeaderboard } from "../services/leaderboard.service";

const querySchema = z.object({
  window: z.enum(["all", "week"]).default("all"),
  group: z.string().trim().min(1).optional(),
});

export async function getLeaderboardHandler(req: Request, res: Response) {
  const { window, group } = querySchema.parse(req.query);

  // Students can only ever see their own group's ranking — the query param
  // is ignored for them, never trusted. Admins must explicitly pick a group.
  let groupName: string;
  if (req.user!.role === "student") {
    if (!req.user!.groupName) {
      return res.json({ window, group: null, entries: [] });
    }
    groupName = req.user!.groupName;
  } else {
    if (!group) throw new HttpError(400, "group query param is required");
    groupName = group;
  }

  const entries = await getLeaderboard(window, groupName);
  res.json({ window, group: groupName, entries });
}
