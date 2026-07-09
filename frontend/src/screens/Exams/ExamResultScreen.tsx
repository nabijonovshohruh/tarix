import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { uz } from "../../i18n/uz";
import { ExamStatus, GradeResult } from "../../api/types";

interface LocationState {
  grade?: GradeResult;
  status?: ExamStatus;
  examTitle?: string;
}

export function ExamResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, resultId } = useParams<{ examId: string; resultId: string }>();
  const { grade, status, examTitle } = (location.state as LocationState) ?? {};

  return (
    <div>
      <Header title={uz.exams.result} showBack />
      <div className="space-y-4 p-4">
        <Card className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{examTitle}</p>
          <p className="mt-2 text-4xl font-bold text-brand-600 dark:text-brand-400">
            {grade ? `${grade.percentage}%` : "—"}
          </p>
          {status && (
            <div className="mt-2">
              <Badge tone={status === "PASSED" ? "success" : "danger"}>
                {status === "PASSED" ? uz.exams.passed : uz.exams.failed}
              </Badge>
            </div>
          )}
          {grade && (
            <>
              <div className="mt-4">
                <ProgressBar percentage={grade.percentage} colorClass={status === "PASSED" ? "bg-emerald-500" : "bg-red-500"} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{uz.exams.totalQuestions}</p>
                  <p className="font-semibold">{grade.total}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{uz.exams.correct}</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400">{grade.correct}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400">{uz.exams.wrong}</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">{grade.wrong}</p>
                </div>
              </div>
            </>
          )}
        </Card>

        <Link to={`/exams/${examId}/result/${resultId}/review`}>
          <Button variant="secondary" className="w-full">
            {uz.exams.reviewMistakes}
          </Button>
        </Link>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/exams")}>
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
