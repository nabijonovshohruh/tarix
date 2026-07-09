import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export function Header({ title, subtitle, showBack = false }: HeaderProps) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-2">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg p-1 text-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Orqaga"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={toggle}
        className="rounded-lg p-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Rejimni almashtirish"
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </header>
  );
}
