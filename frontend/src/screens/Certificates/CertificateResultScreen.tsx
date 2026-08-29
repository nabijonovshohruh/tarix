import { Link, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { uz } from "../../i18n/uz";
import { CertGradeSummary } from "../../api/types";
import { certGradeLabels, certGradeTone } from "../../utils/certificateGrade";

interface LocationState {
  grade?: CertGradeSummary;
  testTitle?: string;
}

export function CertificateResultScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { grade, testTitle } = (location.state as LocationState) ?? {};

  return (
    <div>
      <Header title={uz.certificateTest.result} showBack />
      <div className="space-y-4 p-4">
        <Card className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{testTitle}</p>
          <p className="mt-2 text-4xl font-bold text-brand-600 dark:text-brand-400">
            {grade ? grade.scaledScore.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{uz.certificateTest.scaledScoreLabel}</p>

          {grade && (
            <div className="mt-3">
              <Badge tone={certGradeTone[grade.certGrade]}>
                {grade.certGrade === "NONE" ? uz.certificateTest.noGrade : certGradeLabels[grade.certGrade]}
              </Badge>
            </div>
          )}

          {grade && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">{uz.certificateTest.rawScoreLabel}</p>
                <p className="font-semibold">
                  {grade.rawScore}/{grade.maxPossible}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">{uz.common.percentage}</p>
                <p className="font-semibold">{grade.percentage}%</p>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => navigate("/certificate-test")}>
            {uz.certificateTest.backToCode}
          </Button>
          <Link to="/" className="flex-1">
            <Button className="w-full">{uz.nav.home}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
