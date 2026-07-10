import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Spinner } from "../../components/common/Spinner";
import { Badge } from "../../components/common/Badge";
import { GuestLock } from "../../components/common/GuestLock";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";
import { getExam, submitExam } from "../../api/exams";
import { ApiError } from "../../api/client";
import { CorrectOption, Exam, ExamResult } from "../../api/types";

const optionKeys: CorrectOption[] = ["A", "B", "C", "D"];

export function ExamTakingScreen() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [myResult, setMyResult] = useState<ExamResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CorrectOption>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  useEffect(() => {
    if (!examId || isGuest) return;
    getExam(examId)
      .then(({ exam, myResult }) => {
        setExam(exam);
        setMyResult(myResult);
        if (!myResult && exam.durationMinutes) setSecondsLeft(exam.durationMinutes * 60);
        setLoaded(true);
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : uz.common.error);
        setLoaded(true);
      });
  }, [examId, isGuest]);

  const handleFinish = async () => {
    if (!examId || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = Object.entries(answersRef.current).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      const { result, grade } = await submitExam(examId, payload);
      navigate(`/exams/${examId}/result/${result.id}`, {
        state: { grade, status: result.status, examTitle: exam?.title },
      });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (secondsLeft === null || myResult) return;
    if (secondsLeft <= 0) {
      handleFinish();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, myResult]);

  if (isGuest) {
    return (
      <div>
        <Header title={uz.nav.exams} showBack />
        <GuestLock />
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <Header title={uz.nav.exams} showBack />
        <div className="p-4">
          <Card className="space-y-3 text-center">
            <p className="text-3xl">🔒</p>
            <p className="text-base font-semibold text-red-600 dark:text-red-400">{loadError}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!loaded || !exam) return <Spinner />;

  if (myResult) {
    return (
      <div>
        <Header title={exam.title} showBack />
        <div className="p-4">
          <Card className="space-y-3 text-center">
            <p className="text-3xl">🔒</p>
            <p className="text-base font-semibold text-red-600 dark:text-red-400">{uz.exams.alreadyTaken}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {uz.exams.yourScore}: {myResult.percentage}% ·{" "}
              {myResult.status === "PASSED" ? uz.exams.passed : uz.exams.failed}
            </p>
            <Link to={`/exams/${examId}/result/${myResult.id}/review`}>
              <Button variant="secondary" className="w-full">
                {uz.exams.reviewMistakes}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const questions = exam.questions ?? [];
  const question = questions[index];
  const selected = question ? answers[question.id] : undefined;
  const isLast = index === questions.length - 1;

  const selectOption = (option: CorrectOption) => {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const timerLabel =
    secondsLeft !== null
      ? `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, "0")}`
      : null;

  return (
    <div>
      <Header title={exam.title} showBack />
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span>
            {uz.tests.question} {index + 1} {uz.tests.of} {questions.length}
          </span>
          {timerLabel && <Badge tone={secondsLeft! < 60 ? "danger" : "warning"}>⏱ {timerLabel}</Badge>}
        </div>

        {question && (
          <Card>
            <p className="mb-4 font-medium">{question.questionText}</p>
            <div className="space-y-2">
              {optionKeys.map((key) => (
                <button
                  key={key}
                  onClick={() => selectOption(key)}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                    selected === key
                      ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
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
