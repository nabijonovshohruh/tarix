import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { calibrateCertificateResults, getCertificateResults, getCertificateTest } from "../../../api/certificates";
import { ApiError } from "../../../api/client";
import { CertificateResult, CertificateTest } from "../../../api/types";
import { certGradeLabels, certGradeTone } from "../../../utils/certificateGrade";

export function AdminCertificateResultsScreen() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<CertificateTest | null>(null);
  const [results, setResults] = useState<CertificateResult[] | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!testId) return;
    getCertificateTest(testId).then(({ test }) => setTest(test));
    getCertificateResults(testId).then(({ results }) => setResults(results));
  };
  useEffect(load, [testId]);

  const handleCalibrate = async () => {
    if (!testId || calibrating) return;
    if (!confirm(uz.admin.calibrateConfirm)) return;
    setCalibrating(true);
    setError(null);
    try {
      await calibrateCertificateResults(testId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setCalibrating(false);
    }
  };

  const released = Boolean(test?.resultsReleasedAt);

  return (
    <div>
      <Header title={test?.title ?? uz.admin.viewResults} showBack />
      <div className="space-y-3 p-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{uz.admin.viewResults}</p>
            <Badge tone={released ? "success" : "warning"}>
              {released ? uz.admin.resultsReleased : uz.admin.resultsPending}
            </Badge>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button disabled={calibrating || !results?.length} onClick={handleCalibrate} className="w-full">
            {calibrating
              ? uz.admin.calibrating
              : released
                ? uz.admin.recalibrate
                : uz.admin.calibrateAndRelease}
          </Button>
        </Card>

        {results?.length === 0 && <EmptyState />}
        {results?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{r.student?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {r.rawScore}/{r.maxPossible} · {r.percentage}%
                {r.scaledScore !== null ? ` · ${r.scaledScore.toFixed(1)} ball` : ""}
              </p>
            </div>
            {r.grade === null ? (
              <Badge tone="neutral">{uz.admin.pendingScore}</Badge>
            ) : (
              <Badge tone={certGradeTone[r.grade]}>{certGradeLabels[r.grade]}</Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
