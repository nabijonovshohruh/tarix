import { Card } from "./Card";
import { uz } from "../../i18n/uz";

export function GuestLock() {
  return (
    <div className="p-4">
      <Card className="space-y-2 text-center">
        <p className="text-3xl">🔒</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{uz.tests.guestLocked}</p>
      </Card>
    </div>
  );
}
