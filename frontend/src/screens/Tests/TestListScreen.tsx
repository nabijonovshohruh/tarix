import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { listTests } from "../../api/tests";
import { Period, Test } from "../../api/types";

export function TestListScreen() {
  const { period } = useParams<{ period: Period }>();
  const { isGuest } = useAuth();
  const [tests, setTests] = useState<Test[] | null>(null);

  useEffect(() => {
    if (!period) return;
    listTests({ period }).then(({ tests }) => setTests(tests));
  }, [period]);

  const title = period ? uz.periods[period] : uz.nav.tests;

  return (
    <div>
      <Header title={title} showBack />
      <div className="space-y-3 p-4">
        {tests === null && <Spinner />}
        {tests?.length === 0 && <EmptyState message={uz.tests.noTests} />}
        {tests?.map((test) => {
          const locked = isGuest && !test.isFree;
          const content = (
            <Card
              className={`flex items-center justify-between transition ${
                locked ? "opacity-60" : "hover:border-brand-300 active:scale-[0.99]"
              }`}
            >
              <div>
                <p className="font-semibold">{test.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {test._count?.questions ?? 0} {uz.tests.questionsCount}
                  {isGuest && test.isFree && ` · ${uz.tests.freeTopic}`}
                </p>
              </div>
              <span className="text-lg">{locked ? "🔒" : <span className="text-brand-500">→</span>}</span>
            </Card>
          );

          if (locked) {
            return (
              <div key={test.id} aria-disabled="true" title={uz.tests.locked}>
                {content}
              </div>
            );
          }
          return (
            <Link key={test.id} to={`/tests/${test.id}/take`}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
