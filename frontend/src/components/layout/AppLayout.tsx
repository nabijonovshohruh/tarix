import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DevIdentitySwitcher } from "../dev/DevIdentitySwitcher";
import { useAuth } from "../../context/AuthContext";
import { uz } from "../../i18n/uz";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (!loading && user && !user.isRegistered) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col pb-16">
        <DevIdentitySwitcher />
        <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 font-semibold">{uz.registration.locked}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{uz.registration.lockedHint}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col pb-16">
      <DevIdentitySwitcher />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
