import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { GuestLock } from "../../components/common/GuestLock";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { getActiveSession, getMyAttendance, markAttendance } from "../../api/attendance";
import { ApiError } from "../../api/client";
import { AttendanceRecord, AttendanceSession } from "../../api/types";

function useCountdown(endTime?: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!endTime) return null;
  const remainingMs = new Date(endTime).getTime() - now;
  if (remainingMs <= 0) return "0:00";
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AttendanceScreen() {
  const { isGuest } = useAuth();
  const [session, setSession] = useState<AttendanceSession | null | undefined>(undefined);
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const countdown = useCountdown(session?.endTime);

  const load = () => {
    getActiveSession().then(({ session }) => setSession(session));
    // Attendance history is a paid-student feature — guests have none and
    // the endpoint is paywalled, so skip the call entirely for them.
    if (!isGuest) getMyAttendance().then(({ records }) => setRecords(records));
  };

  useEffect(() => {
    load();
    const id = setInterval(() => getActiveSession().then(({ session }) => setSession(session)), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alreadyMarked = session && records?.some((r) => r.sessionId === session.id);

  const handleMark = async () => {
    if (!session) return;
    setMarking(true);
    setMessage(null);
    try {
      await markAttendance(session.id);
      load();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div>
      <Header title={uz.nav.attendance} />
      <div className="space-y-4 p-4">
        <Card>
          {session === undefined && <p className="text-sm text-slate-500">{uz.common.loading}</p>}
          {session === null && <p className="text-sm text-slate-500 dark:text-slate-400">{uz.attendance.noActiveSession}</p>}
          {session && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{session.title}</p>
                <Badge tone="success">{uz.attendance.activeSession}</Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {uz.attendance.timeLeft}: {countdown}
              </p>
              {isGuest ? (
                <p className="text-sm text-red-600 dark:text-red-400">🔒 {uz.tests.guestLocked}</p>
              ) : alreadyMarked ? (
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  ✓ {uz.attendance.alreadyMarked}
                </p>
              ) : (
                <Button onClick={handleMark} disabled={marking} className="w-full">
                  {uz.attendance.markButton}
                </Button>
              )}
              {message && <p className="text-sm text-red-500">{message}</p>}
            </div>
          )}
        </Card>

        {!isGuest && (
          <div>
            <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.attendance.history}</h2>
            {records === null && <p className="text-sm text-slate-500">{uz.common.loading}</p>}
            {records?.length === 0 && <EmptyState />}
            <div className="space-y-2">
              {records?.map((record) => (
                <Card key={record.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm font-medium">{record.session?.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(record.createdAt).toLocaleString("uz-UZ")}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
