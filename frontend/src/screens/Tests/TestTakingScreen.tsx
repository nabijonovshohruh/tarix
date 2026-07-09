import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { GuestLock } from "../../components/common/GuestLock";
import { uz } from "../../i18n/uz";
import { checkAnswer, getTest, submitTest } from "../../api/tests";
import { ApiError } from "../../api/client";
import { CorrectOption, Test } from "../../api/types";

const optionKeys: CorrectOption[] = ["A", "B", "C", "D"];

interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: CorrectOption;
}

function optionClasses(key: CorrectOption, selected: CorrectOption | undefined, feedback: AnswerFeedback | undefined) {
  if (feedback) {
    if (key === feedback.correctAnswer) {
      return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300";
    }
    if (key === selected && !feedback.isCorrect) {
      return "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300";
    }
    return "border-slate-200 opacity-60 dark:border-slate-800";
  }
  return selected === key
    ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
    : "border-slate-200 dark:border-slate-800";
}

export function TestTakingScreen() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [locked, setLocked] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CorrectOption>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    getTest(testId)
      .then(({ test }) => setTest(test))
      .catch((err) => {
        // A guest hitting a paid topic (e.g. via direct URL, since the list
        // screen already hides the link) — show the lock screen instead of
        // a raw error. The list screen is the primary defense; this is the
        // fallback for whoever bypasses it.
        if (err instanceof ApiError && err.status === 403) setLocked(true);
      });
  }, [testId]);

  if (locked) {
    return (
      <div>
        <Header title={uz.nav.tests} showBack />
        <GuestLock />
      </div>
    );
  }

  if (!test) return <Spinner />;

  const questions = test.questions ?? [];
  const question = questions[index];
  const selected = question ? answers[question.id] : undefined;
  const questionFeedback = question ? feedback[question.id] : undefined;
  const isLast = index === questions.length - 1;

  const selectOption = async (option: CorrectOption) => {
    if (!question || feedback[question.id]) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
    try {
      const result = await checkAnswer(question.id, option);
      setFeedback((prev) => ({ ...prev, [question.id]: result }));
    } catch {
      // Instant feedback is a bonus, not required to proceed — leave the
      // recorded answer in place even if the check call fails.
    }
  };

  const handleFinish = async () => {
    if (!testId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      const { result, grade } = await submitTest(testId, payload);
      navigate(`/tests/${testId}/result/${result.id}`, { state: { grade, testTitle: test.title } });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title={test.title} showBack />
      <div className="space-y-4 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {uz.tests.question} {index + 1} {uz.tests.of} {questions.length}
        </p>

        {question && (
          <Card
            className={
              questionFeedback
                ? questionFeedback.isCorrect
                  ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30"
                : ""
            }
          >
            <p className="mb-4 font-medium">{question.questionText}</p>
            <div className="space-y-2">
              {optionKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => selectOption(key)}
                  disabled={Boolean(questionFeedback)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition disabled:cursor-default ${optionClasses(
                    key,
                    selected,
                    questionFeedback
                  )}`}
                >
                  <span className="font-semibold">{key}.</span>{" "}
                  {question[`option${key}` as keyof typeof question] as string}
                </button>
              ))}
            </div>
          </Card>
        )}

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        <div className="flex gap-3">
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="flex-1"
          >
            {uz.tests.previous}
          </Button>
          {isLast ? (
            <Button
              disabled={submitting || Object.keys(answers).length !== questions.length}
              onClick={handleFinish}
              className="flex-1"
            >
              {uz.tests.finish}
            </Button>
          ) : (
            <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className="flex-1">
              {uz.tests.next}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
