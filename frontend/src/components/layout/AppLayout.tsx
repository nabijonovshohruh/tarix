import { useState } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DevIdentitySwitcher } from "../dev/DevIdentitySwitcher";
import { Button } from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { uz } from "../../i18n/uz";

export function AppLayout() {
  const { user, channelUrl, loading, isAdmin, recheckChannelSubscription } = useAuth();
  const [checking, setChecking] = useState(false);
  const [stillLocked, setStillLocked] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    setStillLocked(false);
    try {
      const subscribed = await recheckChannelSubscription();
      if (!subscribed) setStillLocked(true);
    } finally {
      setChecking(false);
    }
  };

  // Checked before registration — matches the bot-side gate order (channel
  // subscription is "step 0", independent of any DB registration state).
  if (!loading && user && !isAdmin && !user.channelSubscribed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col pb-16">
        <DevIdentitySwitcher />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-4xl">🔒</p>
          <p className="font-semibold">{uz.channelSubscription.locked}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{uz.channelSubscription.lockedHint}</p>
          {channelUrl && (
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              {uz.channelSubscription.openChannel}
            </a>
          )}
          <Button variant="secondary" onClick={handleRecheck} disabled={checking}>
            {uz.channelSubscription.recheck}
          </Button>
          {stillLocked && (
            <p className="text-sm text-red-500">{uz.channelSubscription.stillNotSubscribed}</p>
          )}
        </main>
      </div>
    );
  }

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
