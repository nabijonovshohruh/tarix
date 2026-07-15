import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { createTest, deleteTest, listTests, updateTest } from "../../../api/tests";
import { ApiError } from "../../../api/client";
import { Period, Test } from "../../../api/types";

const periods: Period[] = [
  "GRADE_6",
  "GRADE_7_JAHON",
  "GRADE_7_UZBEKISTON",
  "GRADE_8_JAHON",
  "GRADE_8_UZBEKISTON",
  "GRADE_9_JAHON",
  "GRADE_9_UZBEKISTON",
  "GRADE_10_JAHON",
  "GRADE_10_UZBEKISTON",
  "GRADE_11_JAHON",
  "GRADE_11_UZBEKISTON",
];

export function AdminTestsListScreen() {
  const [tests, setTests] = useState<Test[] | null>(null);
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState<Period>("GRADE_6");
  const [creating, setCreating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = () => listTests({ all: true }).then(({ tests }) => setTests(tests));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await createTest({ title: title.trim(), period });
      setTitle("");
      load();
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (test: Test) => {
    await updateTest(test.id, { isPublished: !test.isPublished });
    load();
  };

  const toggleFree = async (test: Test) => {
    await updateTest(test.id, { isFree: !test.isFree });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Testni o'chirishni tasdiqlaysizmi?")) return;
    setDeleteError(null);
    try {
      await deleteTest(id);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : uz.common.error);
    }
  };

  return (
    <div>
      <Header title={uz.admin.testManagement} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          <p className="text-sm font-semibold">{uz.admin.createTest}</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={uz.admin.testTitle}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {uz.periods[p]}
              </option>
            ))}
          </select>
          <Button onClick={handleCreate} disabled={creating || !title.trim()} className="w-full">
            {uz.common.create}
          </Button>
        </Card>

        {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
        {tests?.length === 0 && <EmptyState />}
        <div className="space-y-2">
          {tests?.map((test) => (
            <Card key={test.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{test.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{uz.periods[test.period]}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={test.isPublished ? "success" : "neutral"}>
                    {test.isPublished ? uz.admin.published : uz.admin.draft}
                  </Badge>
                  <Badge tone={test.isFree ? "warning" : "neutral"}>
                    {test.isFree ? uz.admin.free : uz.admin.paid}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/tests/${test.id}/edit`}>
                  <Button variant="secondary">{uz.common.edit}</Button>
                </Link>
                <Button variant="secondary" onClick={() => togglePublish(test)}>
                  {test.isPublished ? uz.admin.unpublish : uz.admin.publish}
                </Button>
                <Button variant="secondary" onClick={() => toggleFree(test)}>
                  {test.isFree ? uz.admin.makePaid : uz.admin.makeFree}
                </Button>
                <Button variant="danger" onClick={() => handleDelete(test.id)}>
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
