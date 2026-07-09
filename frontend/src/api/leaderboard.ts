import { get } from "./client";
import { LeaderboardEntry } from "./types";

export const getLeaderboard = (window: "all" | "week", group?: string) => {
  const query = new URLSearchParams({ window });
  if (group) query.set("group", group);
  return get<{ window: string; group: string | null; entries: LeaderboardEntry[] }>(
    `/leaderboard?${query.toString()}`
  );
};
