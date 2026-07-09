import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 disabled:bg-brand-300",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
  danger: "bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300",
  ghost: "bg-transparent text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-800",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
