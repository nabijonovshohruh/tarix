import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { EmptyState } from "../../../components/common/EmptyState";
import { QuestionEditCard } from "../../../components/admin/QuestionEditCard";
import { uz } from "../../../i18n/uz";
import {
  addQuestion,
  bulkUploadQuestions,
  deleteQuestion,
  getTest,
  getTestResults,
  updateQuestion,
} from "../../../api/tests";
import { ApiError } from "../../../api/client";
import { BulkUploadResult, CorrectOption, Question, Test, TestResult } from "../../../api/types";

const optionKeys: CorrectOption[] = ["A", "B", "C", "D"];
const optionLabels: Record<CorrectOption, string> = {
  A: uz.admin.optionA,
  B: uz.admin.optionB,
  C: uz.admin.optionC,
  D: uz.admin.optionD,
};
const optionFields: Record<CorrectOption, "optionA" | "optionB" | "optionC" | "optionD"> = {
  A: "optionA",
  B: "optionB",
  C: "optionC",
  D: "optionD",
};

const emptyQuestion = {
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A" as CorrectOption,
  explanation: "",
};

export function AdminTestEditScreen() {
  const { testId } = useParams<{ testId: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [form, setForm] = useState(emptyQuestion);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!testId) return;
    getTest(testId).then(({ test }) => setTest(test));
    getTestResults(testId).then(({ results }) => setResults(results));
  };

  useEffect(load, [testId]);

  const handleAdd = async () => {
    if (!testId || !form.questionText.trim()) return;
    setSaving(true);
    try {
      await addQuestion(testId, { ...form, order: (test?.questions?.length ?? 0) + 1 });
      setForm(emptyQuestion);
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuestion = async (id: string, data: Partial<Question>) => {
    await updateQuestion(id, data);
    load();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Savolni o'chirishni tasdiqlaysizmi?")) return;
    await deleteQuestion(id);
    load();
  };

  const handleFileUpload = async (file: File) => {
    if (!testId) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    try {
      const result = await bulkUploadQuestions(testId, file);
      setUploadResult(result);
      load();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!test) return null;

  return (
    <div>
      <Header title={test.title} showBack />
      <div className="space-y-4 p-4">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            {uz.tests.testList} ({test.questions?.length ?? 0})
          </h2>
          <div className="space-y-2">
            {test.questions?.map((q, i) => (
              <QuestionEditCard
                key={q.id}
                question={q}
                index={i}
                onSave={handleSaveQuestion}
                onDelete={handleDeleteQuestion}
              />
            ))}
          </div>
        </div>

        <Card className="space-y-2">
          <p className="text-sm font-semibold">{uz.admin.addQuestion}</p>
          <input
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            placeholder={uz.admin.questionText}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          {optionKeys.map((key) => (
            <input
              key={key}
              value={form[optionFields[key]]}
              onChange={(e) => setForm({ ...form, [optionFields[key]]: e.target.value })}
              placeholder={optionLabels[key]}
              className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
            />
          ))}
          <textarea
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            placeholder={uz.admin.explanation}
            rows={2}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs">{uz.admin.correctAnswer}:</span>
            <select
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value as CorrectOption })}
              className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700"
            >
              {optionKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd} disabled={saving || !form.questionText.trim()} className="w-full">
            {uz.admin.addQuestion}
          </Button>
        </Card>

        <Card className="space-y-2">
          <p className="text-sm font-semibold">{uz.admin.bulkUpload}</p>
          <a
            href="/savollar-shabloni.xlsx"
            download
            className="inline-block text-xs text-brand-600 underline dark:text-brand-400"
          >
            {uz.admin.downloadTemplate}
          </a>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={uploading}
            className="block w-full text-xs"
          />
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          {uploadResult && (
            <div className="space-y-1 text-xs">
              <p className="text-emerald-600 dark:text-emerald-400">
                {uploadResult.inserted} {uz.admin.uploadInserted}
              </p>
              {uploadResult.skipped.length > 0 && (
                <div className="text-amber-600 dark:text-amber-400">
                  <p>
                    {uploadResult.skipped.length} {uz.admin.uploadSkipped}:
                  </p>
                  <ul className="list-disc pl-4">
                    {uploadResult.skipped.map((s, i) => (
                      <li key={i}>
                        {s.row}-qator — {s.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{uz.admin.viewResults}</h2>
          {results?.length === 0 && <EmptyState />}
          <div className="space-y-2">
            {results?.map((r) => (
              <Card key={r.id} className="flex items-center justify-between py-2.5">
                <p className="text-sm font-medium">{r.student?.fullName}</p>
                <p className="text-sm">{r.percentage}%</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
