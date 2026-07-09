import { useState } from "react";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { uz } from "../../i18n/uz";
import { CorrectOption, Question } from "../../api/types";

const optionKeys: CorrectOption[] = ["A", "B", "C", "D"];
const optionFields: Record<CorrectOption, "optionA" | "optionB" | "optionC" | "optionD"> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
};

export interface QuestionEditCardProps {
  question: Question;
  index: number;
  onSave: (id: string, data: Partial<Question>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function QuestionEditCard({ question, index, onSave, onDelete }: QuestionEditCardProps) {
  const [form, setForm] = useState({
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer ?? "A",
    explanation: question.explanation ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (patch: Partial<typeof form>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(question.id, form);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="space-y-2">
      <input
        value={form.questionText}
        onChange={(e) => update({ questionText: e.target.value })}
        placeholder={`${index + 1}. ${uz.admin.questionText}`}
        className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm font-medium dark:border-slate-700"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {optionKeys.map((key) => (
          <input
            key={key}
            value={form[optionFields[key]]}
            onChange={(e) => update({ [optionFields[key]]: e.target.value } as Partial<typeof form>)}
            placeholder={`${key} javob`}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        ))}
      </div>
      <textarea
        value={form.explanation}
        onChange={(e) => update({ explanation: e.target.value })}
        placeholder={uz.admin.explanation}
        rows={2}
        className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
      />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs">{uz.admin.correctAnswer}:</span>
        <select
          value={form.correctAnswer}
          onChange={(e) => update({ correctAnswer: e.target.value as CorrectOption })}
          className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
        >
          {optionKeys.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <Button onClick={handleSave} disabled={saving || !dirty} className="ml-auto px-3 py-1 text-xs">
          {uz.common.save}
        </Button>
        <Button variant="danger" onClick={() => onDelete(question.id)} className="px-2 py-1 text-xs">
          {uz.common.delete}
        </Button>
      </div>
    </Card>
  );
}
