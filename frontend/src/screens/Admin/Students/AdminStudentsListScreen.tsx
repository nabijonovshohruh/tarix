import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { listStudents, updateStudent } from "../../../api/students";
import { ApiError } from "../../../api/client";
import { DbRole, Student } from "../../../api/types";

type Tab = Extract<DbRole, "STUDENT" | "GUEST">;

export function AdminStudentsListScreen() {
  const [tab, setTab] = useState<Tab>("STUDENT");
  const [students, setStudents] = useState<Student[] | null>(null);
  const [query, setQuery] = useState("");
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promoteGroupName, setPromoteGroupName] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | null>(null);

  const load = () => listStudents(query || undefined, tab).then(({ students }) => setStudents(students));

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [query, tab]);

  const startPromote = (id: string) => {
    setPromotingId(id);
    setPromoteGroupName("");
    setPromoteError(null);
  };

  const confirmPromote = async (id: string) => {
    if (!promoteGroupName.trim()) return;
    setPromoting(true);
    setPromoteError(null);
    try {
      await updateStudent(id, { role: "STUDENT", groupName: promoteGroupName.trim() });
      setPromotingId(null);
      load();
    } catch (err) {
      setPromoteError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div>
      <Header title={uz.admin.studentManagement} showBack />
      <div className="space-y-4 p-4">
        <div className="flex gap-2">
          {(["STUDENT", "GUEST"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                tab === t
                  ? "bg-brand-500 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {t === "STUDENT" ? uz.admin.studentsTab : uz.admin.guestsTab}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={uz.admin.searchStudent}
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />

        {students?.length === 0 && <EmptyState message={tab === "GUEST" ? uz.admin.noGuests : undefined} />}
        <div className="space-y-2">
          {students?.map((student) => {
            if (tab === "STUDENT") {
              return (
                <Link key={student.id} to={`/admin/students/${student.id}`}>
                  <Card className="flex items-center justify-between py-2.5 transition hover:border-brand-300">
                    <div>
                      <p className="text-sm font-medium">{student.fullName}</p>
                      {student.username && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">@{student.username}</p>
                      )}
                    </div>
                    <span className="text-brand-500">→</span>
                  </Card>
                </Link>
              );
            }

            const isPromoting = promotingId === student.id;
            return (
              <Card key={student.id} className="space-y-2 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{student.fullName}</p>
                    {student.username && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{student.username}</p>
                    )}
                  </div>
                  {!isPromoting && (
                    <Button variant="secondary" onClick={() => startPromote(student.id)}>
                      {uz.admin.promoteToStudent}
                    </Button>
                  )}
                </div>
                {isPromoting && (
                  <div className="space-y-2">
                    <input
                      autoFocus
                      value={promoteGroupName}
                      onChange={(e) => setPromoteGroupName(e.target.value)}
                      placeholder={uz.admin.promoteGroupPlaceholder}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                    />
                    {promoteError && <p className="text-xs text-red-500">{promoteError}</p>}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => confirmPromote(student.id)}
                        disabled={promoting || !promoteGroupName.trim()}
                        className="flex-1"
                      >
                        {uz.admin.confirmPromote}
                      </Button>
                      <Button variant="secondary" onClick={() => setPromotingId(null)} className="flex-1">
                        {uz.common.cancel}
                      </Button>
                    </div>
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
