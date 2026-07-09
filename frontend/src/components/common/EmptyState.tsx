import { ReactNode } from "react";
import { uz } from "../../i18n/uz";

export function EmptyState({ message, action }: { message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 py-12 text-center text-slate-500 dark:border-slate-700 dark:text-slate-400">
      <span className="text-3xl">📭</span>
      <p className="text-sm">{message ?? uz.common.empty}</p>
      {action}
    </div>
  );
}
