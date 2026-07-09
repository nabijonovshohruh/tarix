interface Props {
  percentage: number;
  colorClass?: string;
}

export function ProgressBar({ percentage, colorClass = "bg-brand-500" }: Props) {
  const clamped = Math.min(100, Math.max(0, percentage));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className={`h-full rounded-full ${colorClass} transition-all`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
