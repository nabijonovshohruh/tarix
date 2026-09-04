import { NavLink } from "react-router-dom";
import { uz } from "../../i18n/uz";
import { useAuth } from "../../context/AuthContext";

const baseItems = [
  { to: "/", label: uz.nav.home, icon: "🏠", end: true },
  { to: "/tests", label: uz.nav.tests, icon: "📚" },
  { to: "/attendance", label: uz.nav.attendance, icon: "🗓️" },
  { to: "/exams", label: uz.nav.exams, icon: "📝" },
];

// Guests never took a class, so Davomat/Imtihon (and the admin-only
// Boshqaruv tab) are replaced with Qo'llanmalar and TMS testlar — matching
// HomeScreen's own guest-specific tile list. "TMS testlar" points at the
// interactive Certificate Test (PIN entry), not the static materials
// category — that module has no role gating at all, for any role.
const guestItems = [
  { to: "/", label: uz.nav.home, icon: "🏠", end: true },
  { to: "/tests", label: uz.nav.tests, icon: "📚" },
  { to: "/materials/guides", label: uz.nav.guides, icon: "📖" },
  { to: "/certificate-test", label: uz.nav.certificates, icon: "🔑" },
  { to: "/dashboard", label: uz.nav.profile, icon: "👤" },
];

export function BottomNav() {
  const { isAdmin, isGuest } = useAuth();

  const items = isGuest
    ? guestItems
    : [
        ...baseItems,
        isAdmin
          ? { to: "/admin", label: uz.nav.admin, icon: "⚙️" }
          : { to: "/dashboard", label: uz.nav.dashboard, icon: "👤" },
      ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-lg justify-around px-2 py-1.5">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
