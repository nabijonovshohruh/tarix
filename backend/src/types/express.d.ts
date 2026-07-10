export interface AuthenticatedUser {
  id: bigint;
  telegramId: bigint;
  fullName: string;
  username?: string | null;
  role: "guest" | "student" | "admin";
  groupName?: string | null;
  isRegistered: boolean;
  channelSubscribed: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
