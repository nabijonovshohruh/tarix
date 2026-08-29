import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import { GuestLock } from "../../components/common/GuestLock";
import { Spinner } from "../../components/common/Spinner";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { getMyCertificateResults } from "../../api/certificates";
import { CertificateResult } from "../../api/types";
import { certGradeLabels, certGradeTone } from "../../utils/certificateGrade";

export function CertificateMyResultsScreen() {
  const { isGuest } = useAuth();
  const [results, setResults] = useState<CertificateResult[] | null>(null);

  useEffect(() => {
    if (isGuest) return;
    getMyCertificateResults().then(({ results }) => setResults(results));
  }, [isGuest]);

  if (isGuest) {
    return (
      <div>
        <Header title={uz.certificateTest.myResults} showBack />
        <GuestLock />
      </div>
    );
  }

  return (
    <div>
      <Header title={uz.certificateTest.myResults} showBack />
      <div className="space-y-2 p-4">
        {results === null && <Spinner />}
        {results?.length === 0 && <EmptyState message={uz.certificateTest.noResults} />}
        {results?.map((r) => (
          <Card key={r.id} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-sm font-medium">{r.test?.title}</p>
              {r.grade === null ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">{uz.certificateTest.pendingResult}</p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {r.scaledScore?.toFixed(1)} {uz.certificateTest.scaledScoreLabel}
                </p>
              )}
            </div>
            {r.grade === null ? (
              <Badge tone="neutral">{uz.certificateTest.pending}</Badge>
            ) : (
              <Badge tone={certGradeTone[r.grade]}>{certGradeLabels[r.grade]}</Badge>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
