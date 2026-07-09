import { NavLink } from "react-router-dom";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";

const baseItems = [
  { to: "/", label: uz.nav.home, icon: "🏠", end: true },
  { to: "/tests", label: uz.nav.tests, icon: "📚" },
  { to: "/attendance", label: uz.nav.attendance, icon: "🗓️" },
  { to: "/exams", label: uz.nav.exams, icon: "📝" },
];

export function BottomNav() {
  const { isAdmin } = useAuth();
  const lastItem = isAdmin
    ? { to: "/admin", label: uz.nav.admin, icon: "⚙️" }
    : { to: "/dashboard", label: uz.nav.dashboard, icon: "👤" };

  const items = [...baseItems, lastItem];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-1.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-slate-500 dark:text-slate-400"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
