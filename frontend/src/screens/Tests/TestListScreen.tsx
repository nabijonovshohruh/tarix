import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { listTests } from "../../api/tests";
import { Period, SubCategory, Test } from "../../api/types";

const subCategories: SubCategory[] = ["UZBEKISTON", "JAHON"];

export function TestListScreen() {
  const { period, subCategory } = useParams<{ period: Period; subCategory?: SubCategory }>();
  const { isGuest } = useAuth();
  const [tests, setTests] = useState<Test[] | null>(null);

  // Every period except QADIMGI_DUNYO requires picking a sub-category first;
  // QADIMGI_DUNYO keeps its original flat topic list.
  const needsSubCategoryChoice = period !== "QADIMGI_DUNYO" && !subCategory;

  useEffect(() => {
    if (!period || needsSubCategoryChoice) return;
    listTests({ period, subCategory }).then(({ tests }) => setTests(tests));
  }, [period, subCategory, needsSubCategoryChoice]);

  if (needsSubCategoryChoice) {
    return (
      <div>
        <Header title={period ? uz.periods[period] : uz.nav.tests} showBack />
        <div className="space-y-3 p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">{uz.tests.selectSubCategory}</p>
          {subCategories.map((sc) => (
            <Link key={sc} to={`/tests/${period}/${sc}`}>
              <Card className="transition hover:border-brand-300 active:scale-[0.99]">
                <p className="font-semibold">{uz.subCategories[sc]}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const title = period ? uz.periods[period] : uz.nav.tests;
  const subtitle = subCategory ? uz.subCategories[subCategory] : undefined;

  return (
    <div>
      <Header title={title} subtitle={subtitle} showBack />
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
