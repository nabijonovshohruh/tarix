import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { uz } from "../../i18n/uz";
import { listExams } from "../../api/exams";
import { Exam } from "../../api/types";

function scheduleState(exam: Exam): { locked: boolean; label: string | null } {
  const now = Date.now();
  if (exam.startTime && now < new Date(exam.startTime).getTime()) {
    return { locked: true, label: uz.exams.notStarted };
  }
  if (exam.endTime && now > new Date(exam.endTime).getTime()) {
    return { locked: true, label: uz.exams.windowClosed };
  }
  return { locked: false, label: null };
}

export function ExamListScreen() {
  const [exams, setExams] = useState<Exam[] | null>(null);

  useEffect(() => {
    listExams().then(({ exams }) => setExams(exams));
  }, []);

  return (
    <div>
      <Header title={uz.nav.exams} />
      <div className="space-y-3 p-4">
        {exams === null && <Spinner />}
        {exams?.length === 0 && <EmptyState message={uz.exams.noExams} />}
        {exams?.map((exam) => {
          const { locked, label } = scheduleState(exam);
          const content = (
            <Card
              className={`flex items-center justify-between transition ${
                locked ? "opacity-60" : "hover:border-brand-300 active:scale-[0.99]"
              }`}
            >
              <div>
                <p className="font-semibold">{exam.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {exam._count?.questions ?? 0} {uz.tests.questionsCount}
                  {exam.durationMinutes ? ` · ${exam.durationMinutes} ${uz.common.minutes}` : ""}
                  {label ? ` · ${label}` : ""}
                </p>
              </div>
              <span className="text-lg">{locked ? "🔒" : <span className="text-brand-500">→</span>}</span>
            </Card>
          );

          if (locked) {
            return (
              <div key={exam.id} aria-disabled="true" title={label ?? undefined}>
                {content}
              </div>
            );
          }
          return (
            <Link key={exam.id} to={`/exams/${exam.id}/take`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
