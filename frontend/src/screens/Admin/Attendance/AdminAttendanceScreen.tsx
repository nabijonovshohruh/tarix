import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { getActiveSession, listSessions, startSession, stopSession } from "../../../api/attendance";
import { AttendanceSession } from "../../../api/types";

export function AdminAttendanceScreen() {
  const [active, setActive] = useState<AttendanceSession | null | undefined>(undefined);
  const [sessions, setSessions] = useState<AttendanceSession[] | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(10);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getActiveSession().then(({ session }) => setActive(session));
    listSessions().then(({ sessions }) => setSessions(sessions));
  };

  useEffect(load, []);

  const handleStart = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await startSession({ title: title.trim(), durationMinutes: duration });
      setTitle("");
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleStop = async (id: string) => {
    await stopSession(id);
    load();
  };

  return (
    <div>
      <Header title={uz.admin.attendanceManagement} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          {active ? (
            <>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{active.title}</p>
                <Badge tone="success">{uz.attendance.activeSession}</Badge>
              </div>
              <Button variant="danger" onClick={() => handleStop(active.id)} className="w-full">
                {uz.admin.stopAttendance}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold">{uz.admin.startAttendance}</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={uz.admin.sessionTitle}
                className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
              />
              <input
                type="number"
                min={1}
                max={600}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder={uz.admin.duration}
                className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
              />
              <Button onClick={handleStart} disabled={saving || !title.trim()} className="w-full">
                {uz.admin.startAttendance}
              </Button>
            </>
          )}
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.attendance.history}</h2>
          {sessions?.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {sessions?.map((session) => (
              <Link key={session.id} to={`/admin/attendance/${session.id}`}>
                <Card className="flex items-center justify-between py-2.5 transition hover:border-brand-300">
                  <div>
                    <p className="text-sm font-medium">{session.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(session.startTime).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                  <Badge tone={session.status === "ACTIVE" ? "success" : "neutral"}>
                    {session.status === "ACTIVE" ? uz.attendance.activeSession : session._count?.records ?? 0}
                  </Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
