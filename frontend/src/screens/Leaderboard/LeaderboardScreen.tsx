import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { getLeaderboard } from "../../api/leaderboard";
import { getStudentGroups } from "../../api/students";
import { LeaderboardEntry } from "../../api/types";

const medalByRank: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardScreen() {
  const { isAdmin } = useAuth();
  const [window_, setWindow] = useState<"all" | "week">("all");
  const [groups, setGroups] = useState<string[] | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    getStudentGroups().then(({ groups }) => {
      setGroups(groups);
      setSelectedGroup((prev) => prev || groups[0] || "");
    });
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && !selectedGroup) return;
    setEntries(null);
    getLeaderboard(window_, isAdmin ? selectedGroup : undefined).then(({ entries }) => setEntries(entries));
  }, [window_, isAdmin, selectedGroup]);

  return (
    <div>
      <Header title={uz.leaderboard.title} />
      <div className="space-y-4 p-4">
        {isAdmin && (
          <div>
            {groups?.length === 0 ? (
              <EmptyState message={uz.leaderboard.noGroups} />
            ) : (
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
              >
                {!selectedGroup && <option value="">{uz.leaderboard.selectGroup}</option>}
                {groups?.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setWindow("all")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              window_ === "all"
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {uz.leaderboard.allTime}
          </button>
          <button
            onClick={() => setWindow("week")}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              window_ === "week"
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {uz.leaderboard.thisWeek}
          </button>
        </div>

        {entries === null && <Spinner />}
        {entries?.length === 0 && <EmptyState message={uz.leaderboard.empty} />}

        <div className="space-y-2">
          {entries?.map((entry) => (
            <Card key={entry.studentId} className="flex items-center gap-3">
              <span className="w-8 text-center text-lg font-bold text-slate-400 dark:text-slate-500">
                {medalByRank[entry.rank] ?? entry.rank}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{entry.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {uz.leaderboard.averageScore}: {entry.averagePercentage}% · {uz.leaderboard.attendance}:{" "}
                  {entry.attendancePercentage}%
                </p>
              </div>
              <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{entry.combinedScore}</span>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
