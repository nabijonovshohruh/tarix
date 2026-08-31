import { useEffect, useState } from "react";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
import { Button } from "../../components/common/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Spinner } from "../../components/common/Spinner";
import { uz } from "../../i18n/uz";
import { deliverCertificatePdf, getMyCertificateResults } from "../../api/certificates";
import { ApiError } from "../../api/client";
import { CertificateResult } from "../../api/types";
import { certGradeLabels, certGradeTone } from "../../utils/certificateGrade";

type DeliveryState = "idle" | "sending" | "sent" | "error";

// Certificate Test is open to every bot user — no guest lock here (see
// CertificateCodeEntryScreen.tsx's matching note).
export function CertificateMyResultsScreen() {
  const [results, setResults] = useState<CertificateResult[] | null>(null);
  const [delivery, setDelivery] = useState<Record<string, DeliveryState>>({});
  const [deliveryError, setDeliveryError] = useState<Record<string, string>>({});

  useEffect(() => {
    getMyCertificateResults().then(({ results }) => setResults(results));
  }, []);

  const handleDownload = async (resultId: string) => {
    setDelivery((prev) => ({ ...prev, [resultId]: "sending" }));
    try {
      await deliverCertificatePdf(resultId);
      setDelivery((prev) => ({ ...prev, [resultId]: "sent" }));
    } catch (err) {
      setDelivery((prev) => ({ ...prev, [resultId]: "error" }));
      setDeliveryError((prev) => ({
        ...prev,
        [resultId]: err instanceof ApiError ? err.message : uz.common.error,
      }));
    }
  };

  return (
    <div>
      <Header title={uz.certificateTest.myResults} showBack />
      <div className="space-y-2 p-4">
        {results === null && <Spinner />}
        {results?.length === 0 && <EmptyState message={uz.certificateTest.noResults} />}
        {results?.map((r) => {
          const passed = r.grade !== null && r.grade !== "NONE";
          const state = delivery[r.id] ?? "idle";
          return (
            <Card key={r.id} className="space-y-2 py-2.5">
              <div className="flex items-center justify-between">
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
              </div>

              {passed && (
                <>
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={state === "sending"}
                    onClick={() => handleDownload(r.id)}
                  >
                    {state === "sending" ? uz.materials.downloading : uz.certificateTest.downloadPdf}
                  </Button>
                  {state === "sent" && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">{uz.materials.delivered}</p>
                  )}
                  {state === "error" && (
                    <p className="text-xs text-red-500">{deliveryError[r.id] ?? uz.common.error}</p>
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
