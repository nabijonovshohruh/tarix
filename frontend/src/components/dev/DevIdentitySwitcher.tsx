import { DEV_STUDENT, DEV_ADMIN, DEV_GUEST, getDevIdentity, setDevIdentity } from "../../telegram/devIdentity";
import { isMockMode } from "../../telegram/webApp";
import { useAuth } from "../../context/AuthContext";

export function DevIdentitySwitcher() {
  const { reload } = useAuth();
  if (!isMockMode()) return null;

  const current = getDevIdentity();

  const switchTo = (identity: typeof DEV_STUDENT) => {
    setDevIdentity(identity);
    reload();
  };

  const buttonClass = (identity: typeof DEV_STUDENT) =>
    `rounded-full px-2 py-0.5 ${
      current.telegramId === identity.telegramId ? "bg-amber-300 dark:bg-amber-700" : "bg-white/60 dark:bg-black/20"
    }`;

  return (
    <div className="flex items-center gap-2 border-b border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <span className="font-semibold">DEV</span>
      <button onClick={() => switchTo(DEV_GUEST)} className={buttonClass(DEV_GUEST)}>
        🚶 Mehmon
      </button>
      <button onClick={() => switchTo(DEV_STUDENT)} className={buttonClass(DEV_STUDENT)}>
        👨‍🎓 Talaba
      </button>
      <button onClick={() => switchTo(DEV_ADMIN)} className={buttonClass(DEV_ADMIN)}>
        👩‍🏫 Ustoz
      </button>
      <span className="ml-auto opacity-70">initData tekshiruvi o'chirilgan</span>
    </div>
  );
}
