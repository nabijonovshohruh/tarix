import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { uz } from "../../i18n/uz";
import { getMyDashboard } from "../../api/students";
import { getMyTestResults } from "../../api/tests";
import { StudentDashboard, TestResult } from "../../api/types";

const activityIcon = { test: "📚", exam: "📝", attendance: "🗓️" } as const;

export function DashboardScreen() {
  const [dashboard, setDashboard] = useState<StudentDashboard | null>(null);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);

  useEffect(() => {
    getMyDashboard().then(({ dashboard }) => setDashboard(dashboard));
    getMyTestResults().then(({ results }) => setTestResults(results));
  }, []);

  if (!dashboard) return <Spinner />;

  return (
    <div>
      <Header title={uz.dashboard.title} />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.testsCompleted}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.testsCompleted}</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.averageScore}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.averageScore}</p>
          </Card>
          <Card className="text-center">
            <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{dashboard.attendancePercentage}%</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{uz.dashboard.attendancePercentage}</p>
          </Card>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.dashboard.examResults}</h2>
          {dashboard.examResults.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {dashboard.examResults.map((r) => (
              <Link key={r.id} to={`/exams/${r.examId}/result/${r.id}/review`}>
                <Card className="flex items-center justify-between py-2.5 transition hover:border-brand-300">
                  <p className="text-sm font-medium">{r.exam?.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.percentage}%</span>
                    <Badge tone={r.status === "PASSED" ? "success" : "danger"}>
                      {r.status === "PASSED" ? uz.exams.passed : uz.exams.failed}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.dashboard.testHistory}</h2>
          {testResults?.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {testResults?.map((r) => (
              <Link key={r.id} to={`/tests/${r.testId}/result/${r.id}/review`}>
                <Card className="flex items-center justify-between py-2.5 transition hover:border-brand-300">
                  <p className="text-sm font-medium">{r.test?.title}</p>
                  <span className="text-sm">{r.percentage}%</span>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.dashboard.recentActivity}</h2>
          {dashboard.recentActivity.length === 0 && <EmptyState message={uz.dashboard.noActivity} />}
          <div className="space-y-2">
            {dashboard.recentActivity.map((item, i) => {
              const content = (
                <Card className="flex items-center gap-3 py-2.5 transition hover:border-brand-300">
                  <span>{activityIcon[item.type]}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                  {item.percentage !== undefined && <span className="text-sm">{item.percentage}%</span>}
                </Card>
              );

              if (item.type === "test" && item.testId) {
                return (
                  <Link key={i} to={`/tests/${item.testId}/result/${item.id}/review`}>
                    {content}
                  </Link>
                );
              }
              if (item.type === "exam" && item.examId) {
                return (
                  <Link key={i} to={`/exams/${item.examId}/result/${item.id}/review`}>
                    {content}
                  </Link>
                );
              }
              return <div key={i}>{content}</div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
