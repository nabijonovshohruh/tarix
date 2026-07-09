import { ReactNode } from "react";

type Tone = "success" | "danger" | "neutral" | "warning";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
