import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { uz } from "../../i18n/uz";
import { submitCertificateTest } from "../../api/certificates";
import { ApiError } from "../../api/client";
import { CertAnswerSheetTest, CertSubmittedAnswer, CorrectOption, MatchOption } from "../../api/types";

const mcqOptionKeys: CorrectOption[] = ["A", "B", "C", "D"];
const matchingOptionKeys: MatchOption[] = ["A", "B", "C", "D", "E", "F"];

interface LocationState {
  test?: CertAnswerSheetTest;
}

export function CertificateAnswerSheetScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { test } = (location.state as LocationState) ?? {};

  const [mcqAnswers, setMcqAnswers] = useState<Record<string, CorrectOption>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, Record<string, MatchOption>>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, { a?: string; b?: string }>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect back to code entry if this screen is opened directly (refresh,
  // bookmark, back-navigation) without the answer sheet carried in state —
  // there's nothing to render without it, and no separate fetch-by-id path
  // for students (the code access endpoint is the only entry point).
  if (!test) {
    return <Navigate to="/certificate-test" replace />;
  }

  const isAnswered = (q: CertAnswerSheetTest["questions"][number]) => {
    if (q.type === "MCQ") return Boolean(mcqAnswers[q.id]);
    if (q.type === "MATCHING") {
      const chosen = matchingAnswers[q.id] ?? {};
      return (q.matchItems ?? []).every((item) => Boolean(chosen[item.label]));
    }
    const answer = openAnswers[q.id];
    const hasA = Boolean(answer?.a?.trim());
    const hasB = q.openLabelB ? Boolean(answer?.b?.trim()) : true;
    return hasA && hasB;
  };

  const answeredCount = useMemo(
    () => test.questions.filter(isAnswered).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [test, mcqAnswers, matchingAnswers, openAnswers]
  );
  const allAnswered = answeredCount === test.questions.length;

  const handleSubmit = async () => {
    if (submitting || !allAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      const answers: CertSubmittedAnswer[] = test.questions.map((q) => {
        if (q.type === "MCQ") return { questionId: q.id, selectedOption: mcqAnswers[q.id] };
        if (q.type === "MATCHING") {
          const chosen = matchingAnswers[q.id] ?? {};
          return {
            questionId: q.id,
            selectedMatches: Object.entries(chosen).map(([label, selectedOption]) => ({
              label,
              selectedOption,
            })),
          };
        }
        const answer = openAnswers[q.id];
        return { questionId: q.id, answerA: answer?.a, answerB: answer?.b };
      });

      const { grade } = await submitCertificateTest(test.id, answers);
      navigate("/certificate-test/result", { state: { grade, testTitle: test.title } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title={test.title || uz.certificateTest.answerSheet} showBack />
      <div className="space-y-3 p-4 pb-24">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>{uz.certificateTest.answerSheet}</span>
          <span>
            {uz.certificateTest.progress}: {answeredCount}/{test.questions.length}
          </span>
        </div>

        {test.questions.map((q) => (
          <Card key={q.id} className="space-y-3">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {uz.certificateTest.question} {q.order}
            </p>

            {q.type === "MCQ" && (
              <div className="flex gap-2">
                {mcqOptionKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMcqAnswers((prev) => ({ ...prev, [q.id]: key }))}
                    className={`flex-1 rounded-xl border py-3 text-center text-base font-semibold transition ${
                      mcqAnswers[q.id] === key
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                        : "border-slate-200 hover:border-brand-300 dark:border-slate-800 dark:hover:border-brand-700"
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}

            {q.type === "MATCHING" && (
              <div className="space-y-2">
                {(q.matchItems ?? []).map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{item.label}</span>
                    <select
                      value={matchingAnswers[q.id]?.[item.label] ?? ""}
                      onChange={(e) =>
                        setMatchingAnswers((prev) => ({
                          ...prev,
                          [q.id]: { ...prev[q.id], [item.label]: e.target.value as MatchOption },
                        }))
                      }
                      className="rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                    >
                      <option value="" disabled>
                        {uz.certificateTest.selectOption}
                      </option>
                      {matchingOptionKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {q.type === "OPEN" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-sm font-medium">{q.openLabelA ?? "a)"}</span>
                  <input
                    value={openAnswers[q.id]?.a ?? ""}
                    onChange={(e) =>
                      setOpenAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], a: e.target.value } }))
                    }
                    placeholder={uz.certificateTest.openAnswerPlaceholder}
                    className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                  />
                </div>
                {q.openLabelB && (
                  <div className="flex items-center gap-2">
                    <span className="w-8 shrink-0 text-sm font-medium">{q.openLabelB}</span>
                    <input
                      value={openAnswers[q.id]?.b ?? ""}
                      onChange={(e) =>
                        setOpenAnswers((prev) => ({ ...prev, [q.id]: { ...prev[q.id], b: e.target.value } }))
                      }
                      placeholder={uz.certificateTest.openAnswerPlaceholder}
                      className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button disabled={submitting || !allAnswered} onClick={handleSubmit} className="w-full">
          {submitting ? uz.certificateTest.submitting : uz.certificateTest.submit}
        </Button>
      </div>
    </div>
  );
}
