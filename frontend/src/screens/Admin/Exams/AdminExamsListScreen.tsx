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

export function AdminExamsListScreen() {
  const [exams, setExams] = useState<Exam[] | null>(null);
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => listExams({ all: true }).then(({ exams }) => setExams(exams));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createExam({ title: title.trim(), durationMinutes: duration ? Number(duration) : undefined });
      setTitle("");
      setDuration("");
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
          <Button onClick={handleCreate} disabled={creating || !title.trim()} className="w-full">
            {uz.common.create}
          </Button>
        </Card>

        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        {exams?.length === 0 && <EmptyState />}
        <div className="space-y-2">
          {exams?.map((exam) => (
            <Card key={exam.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{exam.title}</p>
                  {exam.durationMinutes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {exam.durationMinutes} {uz.common.minutes}
                    </p>
                  )}
                </div>
                <Badge tone={exam.isPublished ? "success" : "neutral"}>
                  {exam.isPublished ? uz.admin.published : uz.admin.draft}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/exams/${exam.id}/edit`}>
                  <Button variant="secondary">{uz.common.edit}</Button>
                </Link>
                <Button variant="secondary" onClick={() => togglePublish(exam)}>
                  {exam.isPublished ? uz.admin.unpublish : uz.admin.publish}
                </Button>
                <Button variant="danger" onClick={() => handleDelete(exam.id)}>
                  {uz.common.delete}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
