import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { ProgressBar } from "../../components/common/ProgressBar";
import { uz } from "../../i18n/uz";
import { GradeResult } from "../../api/types";

interface LocationState {
  grade?: GradeResult;
  testTitle?: string;
}

export function TestResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { testId, resultId } = useParams<{ testId: string; resultId: string }>();
  const { grade, testTitle } = (location.state as LocationState) ?? {};

  return (
    <div>
      <Header title={uz.tests.result} showBack />
      <div className="space-y-4 p-4">
        <Card className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{testTitle}</p>
          <p className="mt-2 text-4xl font-bold text-brand-600 dark:text-brand-400">
            {grade ? `${grade.percentage}%` : "—"}
          </p>
          {grade && (
            <>
              <div className="mt-4">
                <ProgressBar percentage={grade.percentage} />
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                {uz.tests.correctAnswers}: {grade.correct} / {grade.total}
              </p>
            </>
          )}
        </Card>

        <Link to={`/tests/${testId}/result/${resultId}/review`}>
          <Button variant="secondary" className="w-full">
            {uz.tests.reviewMistakes}
          </Button>
        </Link>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/tests")}>
            {uz.common.back}
          </Button>
          <Link to="/dashboard" className="flex-1">
            <Button className="w-full">{uz.nav.dashboard}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
