import { Link } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { uz } from "../../i18n/uz";
import { Period } from "../../api/types";

const periods: Period[] = ["QADIMGI_DUNYO", "ORTA_ASRLAR", "YANGI_DAVR", "ENG_YANGI_DAVR"];

export function PeriodListScreen() {
  return (
    <div>
      <Header title={uz.nav.tests} />
      <div className="space-y-3 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{uz.tests.selectPeriod}</p>
        {periods.map((period) => (
          <Link key={period} to={`/tests/${period}`}>
            <Card className="transition hover:border-brand-300 active:scale-[0.99]">
              <p className="font-semibold">{uz.periods[period]}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
