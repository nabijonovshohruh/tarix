import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { uz } from "../../i18n/uz";
import { accessCertificateTestByCode } from "../../api/certificates";
import { ApiError } from "../../api/client";

// Certificate Test is open to every bot user — no guest lock here, unlike
// most other features in the app (channel subscription is also bypassed
// for this section specifically, see AppLayout.tsx and backend/src/routes/index.ts).
export function CertificateCodeEntryScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(() => searchParams.get("certCode") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (codeToUse = code) => {
    const trimmed = codeToUse.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { test } = await accessCertificateTestByCode(trimmed);
      navigate("/certificate-test/answer-sheet", { state: { test } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setLoading(false);
    }
  };

  // A teacher's shared access link carries the code as ?certCode=... —
  // pre-fill and auto-submit once so tapping the link is a single step.
  useEffect(() => {
    const fromLink = searchParams.get("certCode");
    if (fromLink) handleSubmit(fromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <Header title={uz.certificateTest.homeTitle} showBack />
      <div className="space-y-4 p-4">
        <Card className="space-y-3 text-center">
          <p className="text-4xl">🔑</p>
          <p className="text-base font-semibold">{uz.certificateTest.enterCode}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{uz.certificateTest.codeHint}</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={uz.certificateTest.codePlaceholder}
            inputMode="numeric"
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-3 text-center text-2xl font-semibold tracking-widest dark:border-slate-700"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={() => handleSubmit()} disabled={loading || !code.trim()} className="w-full">
            {loading ? uz.common.loading : uz.certificateTest.loadTest}
          </Button>
        </Card>

        <Link to="/certificate-test/results" className="block text-center text-sm text-brand-600 underline dark:text-brand-400">
          {uz.certificateTest.myResults}
        </Link>
      </div>
    </div>
  );
}
