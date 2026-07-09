import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DevIdentitySwitcher } from "../dev/DevIdentitySwitcher";

export function AppLayout() {
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
