export interface DevIdentity {
  telegramId: string;
  fullName: string;
  role: "guest" | "student" | "admin";
}

// DEV_ADMIN's id must match an entry in the backend's ADMIN_TELEGRAM_IDS env
// var (see .env.example) for the admin identity to actually resolve to the
// admin role. DEV_GUEST uses a telegramId that has never been seen by the
// backend before, so it always resolves to the real default: guest.
export const DEV_STUDENT: DevIdentity = { telegramId: "111111", fullName: "Test Talaba", role: "student" };
export const DEV_ADMIN: DevIdentity = { telegramId: "999999", fullName: "Test Ustoz", role: "admin" };
export const DEV_GUEST: DevIdentity = { telegramId: "333333", fullName: "Test Mehmon", role: "guest" };

const STORAGE_KEY = "tarix.devIdentity";

export function getDevIdentity(): DevIdentity {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as DevIdentity;
    } catch {
      // fall through to default
    }
  }
  return DEV_STUDENT;
}

export function setDevIdentity(identity: DevIdentity) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
}
