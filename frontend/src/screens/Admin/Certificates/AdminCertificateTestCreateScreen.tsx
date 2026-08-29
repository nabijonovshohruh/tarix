import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "../../../components/layout/Header";
import { Card } from "../../../components/common/Card";
import { Button } from "../../../components/common/Button";
import { uz } from "../../../i18n/uz";
import { addCertificateQuestion, createCertificateTest, updateCertificateTest } from "../../../api/certificates";
import { ApiError } from "../../../api/client";
import { CertificateTest, CorrectOption, MatchOption } from "../../../api/types";

const MCQ_COUNT = 32;
const MATCHING_COUNT = 3;
const MATCHING_ITEMS_PER_QUESTION = 6;
const OPEN_COUNT = 10;

const mcqOptionKeys: CorrectOption[] = ["A", "B", "C", "D"];
const matchingOptionKeys: MatchOption[] = ["A", "B", "C", "D", "E", "F"];

function AnswerToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-1 gap-1">
      {options.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition ${
            value === key
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
              : "border-slate-200 dark:border-slate-800"
          }`}
        >
          {key}
        </button>
      ))}
    </div>
  );
}

export function AdminCertificateTestCreateScreen() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [mcqAnswers, setMcqAnswers] = useState<CorrectOption[]>(Array(MCQ_COUNT).fill("A"));
  const [matchingAnswers, setMatchingAnswers] = useState<MatchOption[][]>(
    Array.from({ length: MATCHING_COUNT }, () => Array(MATCHING_ITEMS_PER_QUESTION).fill("A"))
  );
  const [openAnswers, setOpenAnswers] = useState<{ a: string; b: string }[]>(
    Array.from({ length: OPEN_COUNT }, () => ({ a: "", b: "" }))
  );
  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ test: CertificateTest; accessLink: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const totalQuestions = MCQ_COUNT + MATCHING_COUNT + OPEN_COUNT;

  const handleCreate = async () => {
    if (!title.trim() || creating) return;
    const incompleteOpen = openAnswers.some((o) => !o.a.trim() || !o.b.trim());
    if (incompleteOpen) {
      setError(uz.admin.incompleteOpenAnswers);
      return;
    }

    setCreating(true);
    setError(null);
    setProgress(0);
    try {
      const { test, accessLink } = await createCertificateTest(title.trim());

      for (let i = 0; i < MCQ_COUNT; i++) {
        await addCertificateQuestion(test.id, {
          type: "MCQ",
          questionText: `${i + 1}-savol`,
          order: i + 1,
          optionA: "A",
          optionB: "B",
          optionC: "C",
          optionD: "D",
          correctOption: mcqAnswers[i],
        });
        setProgress((p) => p + 1);
      }

      for (let i = 0; i < MATCHING_COUNT; i++) {
        await addCertificateQuestion(test.id, {
          type: "MATCHING",
          questionText: `${MCQ_COUNT + 1 + i}-savol`,
          order: MCQ_COUNT + 1 + i,
          matchItems: matchingAnswers[i].map((correctOption, idx) => ({
            label: String(idx + 1),
            correctOption,
          })),
        });
        setProgress((p) => p + 1);
      }

      const openStart = MCQ_COUNT + MATCHING_COUNT + 1;
      for (let i = 0; i < OPEN_COUNT; i++) {
        await addCertificateQuestion(test.id, {
          type: "OPEN",
          questionText: `${openStart + i}-savol`,
          order: openStart + i,
          openLabelA: "a)",
          openAnswerA: openAnswers[i].a.trim(),
          openLabelB: "b)",
          openAnswerB: openAnswers[i].b.trim(),
        });
        setProgress((p) => p + 1);
      }

      setCreated({ test, accessLink });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : uz.common.error);
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async () => {
    if (!created) return;
    await updateCertificateTest(created.test.id, { isPublished: true });
    navigate("/admin/certificate-tests");
  };

  const handleCopyLink = async () => {
    if (!created?.accessLink) return;
    await navigator.clipboard.writeText(created.accessLink);
    setCopied(true);
  };

  if (created) {
    return (
      <div>
        <Header title={uz.admin.certificateTestManagement} showBack />
        <div className="space-y-4 p-4">
          <Card className="space-y-3 text-center">
            <p className="text-3xl">✅</p>
            <p className="font-semibold">{created.test.title}</p>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.testCode}</p>
              <p className="text-4xl font-bold tracking-widest text-brand-600 dark:text-brand-400">
                {created.test.testCode}
              </p>
            </div>
            {created.accessLink && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400">{uz.admin.accessLink}</p>
                <p className="break-all rounded-lg bg-slate-100 p-2 text-xs dark:bg-slate-800">
                  {created.accessLink}
                </p>
                <Button variant="secondary" className="w-full" onClick={handleCopyLink}>
                  {copied ? uz.admin.copied : uz.admin.copyLink}
                </Button>
              </div>
            )}
            <Button className="w-full" onClick={handlePublish}>
              {uz.admin.publishNow}
            </Button>
            <Link to="/admin/certificate-tests">
              <Button variant="secondary" className="w-full">
                {uz.common.back}
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={uz.admin.createCertificateTest} showBack />
      <div className="space-y-4 p-4 pb-24">
        <Card className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={uz.admin.certificateTestTitle}
            className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
          />
        </Card>

        <Card className="space-y-2">
          <p className="text-sm font-semibold">{uz.admin.mcqSection}</p>
          <div className="space-y-2">
            {mcqAnswers.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-sm text-slate-500 dark:text-slate-400">{i + 1}.</span>
                <AnswerToggle
                  options={mcqOptionKeys}
                  value={val}
                  onChange={(v) => setMcqAnswers((prev) => prev.map((p, idx) => (idx === i ? v : p)))}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <p className="text-sm font-semibold">{uz.admin.matchingSection}</p>
          {matchingAnswers.map((items, qIdx) => (
            <div key={qIdx} className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {MCQ_COUNT + 1 + qIdx}-savol
              </p>
              {items.map((val, itemIdx) => (
                <div key={itemIdx} className="flex items-center gap-2">
                  <span className="w-8 shrink-0 text-sm text-slate-500 dark:text-slate-400">{itemIdx + 1}.</span>
                  <AnswerToggle
                    options={matchingOptionKeys}
                    value={val}
                    onChange={(v) =>
                      setMatchingAnswers((prev) =>
                        prev.map((row, qi) => (qi === qIdx ? row.map((p, ii) => (ii === itemIdx ? v : p)) : row))
                      )
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-semibold">{uz.admin.openSection}</p>
          {openAnswers.map((row, i) => (
            <div key={i} className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {MCQ_COUNT + MATCHING_COUNT + 1 + i}-savol
              </p>
              <div className="flex gap-2">
                <input
                  value={row.a}
                  onChange={(e) =>
                    setOpenAnswers((prev) => prev.map((r, idx) => (idx === i ? { ...r, a: e.target.value } : r)))
                  }
                  placeholder="a)"
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                />
                <input
                  value={row.b}
                  onChange={(e) =>
                    setOpenAnswers((prev) => prev.map((r, idx) => (idx === i ? { ...r, b: e.target.value } : r)))
                  }
                  placeholder="b)"
                  className="w-full rounded-lg border border-slate-200 bg-transparent px-3 py-2 text-sm dark:border-slate-700"
                />
              </div>
            </div>
          ))}
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button disabled={creating || !title.trim()} onClick={handleCreate} className="w-full">
          {creating ? `${uz.admin.creatingTest} (${progress}/${totalQuestions})` : uz.admin.createAndGenerateCode}
        </Button>
      </div>
    </div>
  );
}
