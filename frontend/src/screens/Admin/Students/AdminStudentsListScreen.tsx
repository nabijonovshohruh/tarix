import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { listStudents } from "../../../api/students";
import { Student } from "../../../api/types";

export function AdminStudentsListScreen() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = setTimeout(() => {
      listStudents(query || undefined).then(({ students }) => setStudents(students));
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div>
      <Header title={uz.admin.studentManagement} showBack />
      <div className="space-y-4 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={uz.admin.searchStudent}
          className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
        />

        {students?.length === 0 && <EmptyState />}
        <div className="space-y-2">
          {students?.map((student) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
