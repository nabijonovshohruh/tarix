import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { uz } from "../../../i18n/uz";
import { listTests } from "../../../api/tests";
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

// Category overview — drills into /admin/tests/:period (AdminTestCategoryScreen)
// for the actual create/edit/delete list, keeping this screen a flat, scannable
// set of counters instead of one long list of every test across all 11 grades.
export function AdminTestsListScreen() {
  const [tests, setTests] = useState<Test[] | null>(null);

  useEffect(() => {
    listTests({ all: true }).then(({ tests }) => setTests(tests));
  }, []);

  return (
    <div>
      <Header title={uz.admin.testManagement} showBack />
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{uz.tests.selectPeriod}</p>
        {periods.map((period) => {
          const periodTests = tests?.filter((t) => t.period === period) ?? [];
          const publishedCount = periodTests.filter((t) => t.isPublished).length;
          return (
            <Link key={period} to={`/admin/tests/${period}`}>
              <Card className="flex items-center justify-between transition hover:border-brand-300 active:scale-[0.99]">
                <p className="font-semibold">{uz.periods[period]}</p>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {tests ? `${publishedCount}/${periodTests.length} ${uz.admin.topicsCount}` : "…"}
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
