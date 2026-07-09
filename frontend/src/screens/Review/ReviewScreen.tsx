import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../components/layout/Header";
import { Card } from "../../components/common/Card";
import { Spinner } from "../../components/common/Spinner";
import { EmptyState } from "../../components/common/EmptyState";
import { uz } from "../../i18n/uz";
import { getTestResultReview } from "../../api/tests";
import { getExamResultReview } from "../../api/exams";
import { AnswerSnapshot, CorrectOption } from "../../api/types";

const optionField: Record<CorrectOption, "optionA" | "optionB" | "optionC" | "optionD"> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
};

function optionText(answer: AnswerSnapshot, option: CorrectOption | null) {
  if (!option) return uz.tests.notAnswered;
  return `${option}. ${answer[optionField[option]]}`;
}

export function ReviewScreen({ kind }: { kind: "test" | "exam" }) {
  const { resultId } = useParams<{ resultId: string }>();
  const [answers, setAnswers] = useState<AnswerSnapshot[] | null>(null);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (!resultId) return;
    if (kind === "test") {
      getTestResultReview(resultId).then(({ result }) => {
        setAnswers(result.answers ?? []);
        setTitle(result.test?.title ?? "");
      });
    } else {
      getExamResultReview(resultId).then(({ result }) => {
        setAnswers(result.answers ?? []);
        setTitle(result.exam?.title ?? "");
      });
    }
  }, [resultId, kind]);

  if (answers === null) return <Spinner />;

  const wrongAnswers = answers.filter((a) => !a.isCorrect);

  return (
    <div>
      <Header title={uz.tests.reviewMistakes} showBack />
      <div className="space-y-4 p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>

        {answers.length === 0 && <EmptyState message={uz.tests.reviewUnavailable} />}
        {answers.length > 0 && wrongAnswers.length === 0 && <EmptyState message={uz.tests.noMistakes} />}

        {wrongAnswers.map((a) => (
          <Card key={a.id} className="space-y-2">
            <p className="text-sm font-medium">{a.questionText}</p>
            <p className="text-sm text-red-600 dark:text-red-400">
              {uz.tests.yourAnswer}: {optionText(a, a.selectedOption)}
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {uz.tests.correctAnswerLabel}: {optionText(a, a.correctAnswer)}
            </p>
            {a.explanation && (
              <p className="rounded-lg bg-slate-100 p-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                💡 {a.explanation}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
