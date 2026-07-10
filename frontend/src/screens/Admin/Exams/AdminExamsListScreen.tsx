import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { createExam, deleteExam, listExams, updateExam } from "../../../api/exams";
import { ApiError } from "../../../api/client";
import { Exam } from "../../../api/types";

// datetime-local inputs need "YYYY-MM-DDTHH:mm" — sliced straight from the
// ISO string with no timezone conversion, matching how the rest of this app
// treats dates (server wall-clock time, no explicit timezone handling).
function toDatetimeLocal(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

function formatSchedule(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminExamsListScreen() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [schedulingId, setSchedulingId] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  const load = () => listExams({ all: true }).then(({ exams }) => setExams(exams));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createExam({
        title: title.trim(),
        durationMinutes: duration ? Number(duration) : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      });
      setTitle("");
      setDuration("");
      setStartTime("");
      setEndTime("");
      load();
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (exam: Exam) => {
    await updateExam(exam.id, { isPublished: !exam.isPublished });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Imtihonni o'chirishni tasdiqlaysizmi?")) return;
    setDeleteError(null);
    try {
      await deleteExam(id);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : uz.common.error);
    }
  };

  const startScheduling = (exam: Exam) => {
    setSchedulingId(exam.id);
    setScheduleStart(toDatetimeLocal(exam.startTime));
    setScheduleEnd(toDatetimeLocal(exam.endTime));
    setScheduleError(null);
  };

  const saveSchedule = async (id: string) => {
    setSavingSchedule(true);
    setScheduleError(null);
    try {
      await updateExam(id, {
        startTime: scheduleStart || null,
        endTime: scheduleEnd || null,
      });
      setSchedulingId(null);
      load();
    } catch (err) {
      setScheduleError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div>
      <Header title={uz.admin.examManagement} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          <p className="text-sm font-semibold">{uz.admin.createExam}</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={uz.admin.examTitle}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder={`${uz.exams.timer} (${uz.common.minutes}, ixtiyoriy)`}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.examStart}</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.examEnd}</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            />
          </div>
          <Button onClick={handleCreate} disabled={creating || !title.trim()} className="w-full">
            {uz.common.create}
          </Button>
        </Card>

        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        {exams?.length === 0 && <EmptyState />}
        <div className="space-y-2">
          {exams?.map((exam) => {
            const scheduleLabel = [formatSchedule(exam.startTime), formatSchedule(exam.endTime)]
              .filter(Boolean)
              .join(" — ");
            return (
              <Card key={exam.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{exam.title}</p>
                    {exam.durationMinutes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {exam.durationMinutes} {uz.common.minutes}
                      </p>
                    )}
                    {scheduleLabel && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{scheduleLabel}</p>
                    )}
                  </div>
                  <Badge tone={exam.isPublished ? "success" : "neutral"}>
                    {exam.isPublished ? uz.admin.published : uz.admin.draft}
                  </Badge>
                </div>

                {schedulingId === exam.id ? (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.examStart}</label>
                      <input
                        type="datetime-local"
                        value={scheduleStart}
                        onChange={(e) => setScheduleStart(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.examEnd}</label>
                      <input
                        type="datetime-local"
                        value={scheduleEnd}
                        onChange={(e) => setScheduleEnd(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                      />
                    </div>
                    {scheduleError && <p className="text-xs text-red-500">{scheduleError}</p>}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveSchedule(exam.id)}
                        disabled={savingSchedule}
                        className="flex-1"
                      >
                        {uz.common.save}
                      </Button>
                      <Button variant="secondary" onClick={() => setSchedulingId(null)} className="flex-1">
                        {uz.common.cancel}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/exams/${exam.id}/edit`}>
                      <Button variant="secondary">{uz.common.edit}</Button>
                    </Link>
                    <Button variant="secondary" onClick={() => startScheduling(exam)}>
                      {uz.admin.setSchedule}
                    </Button>
                    <Button variant="secondary" onClick={() => togglePublish(exam)}>
                      {exam.isPublished ? uz.admin.unpublish : uz.admin.publish}
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(exam.id)}>
                      {uz.common.delete}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
