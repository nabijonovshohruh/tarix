import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { getSessionDetail } from "../../../api/attendance";
import { SessionRoster } from "../../../api/types";

export function AdminSessionDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [roster, setRoster] = useState<SessionRoster | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    getSessionDetail(sessionId).then(setRoster);
  }, [sessionId]);

  if (!roster) return null;

  return (
    <div>
      <Header title={roster.session.title} showBack />
      <div className="space-y-4 p-4">
        <Card className="text-center">
          <p className="text-3xl font-bold text-brand-600 dark:text-brand-400">{roster.percentage}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{uz.dashboard.attendancePercentage}</p>
        </Card>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {uz.attendance.present} <Badge tone="success">{roster.present.length}</Badge>
          </h2>
          {roster.present.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {roster.present.map((s) => (
              <Card key={s.id} className="py-2.5 text-sm">
                {s.fullName}
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {uz.attendance.absent} <Badge tone="danger">{roster.absent.length}</Badge>
          </h2>
          {roster.absent.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {roster.absent.map((s) => (
              <Card key={s.id} className="py-2.5 text-sm">
                {s.fullName}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
