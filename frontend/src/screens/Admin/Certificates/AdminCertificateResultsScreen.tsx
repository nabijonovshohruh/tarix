import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Badge } from "../../../components/common/Badge";
import { EmptyState } from "../../../components/common/EmptyState";
import { uz } from "../../../i18n/uz";
import { getCertificateResults, getCertificateTest } from "../../../api/certificates";
import { CertificateResult, CertificateTest } from "../../../api/types";
import { certGradeLabels, certGradeTone } from "../../../utils/certificateGrade";

export function AdminCertificateResultsScreen() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<CertificateTest | null>(null);
  const [results, setResults] = useState<CertificateResult[] | null>(null);

  useEffect(() => {
    if (!testId) return;
    getCertificateTest(testId).then(({ test }) => setTest(test));
    getCertificateResults(testId).then(({ results }) => setResults(results));
  }, [testId]);

  return (
    <div>
      <Header title={test?.title ?? uz.admin.viewResults} showBack />
      <div className="space-y-2 p-4">
        {results?.length === 0 && <EmptyState />}
        {results?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{r.student?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {r.rawScore}/{r.maxPossible} · {r.percentage}% · {r.scaledScore.toFixed(1)} ball
              </p>
            </div>
            <Badge tone={certGradeTone[r.grade]}>{certGradeLabels[r.grade]}</Badge>
          </Card>
        ))}
      </div>
    </div>
  );
}
