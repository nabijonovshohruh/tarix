import { NextFunction, Request, Response } from "express";

// Blocks every route except /auth/me for a Telegram account that hasn't yet
// completed the bot's mandatory name-registration conversation (see
// bot/bot.ts) — the frontend uses this error code to render a lock screen
// instead of the app.
export function requireRegistered(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.isRegistered) {
    return res.status(403).json({ error: "registration_required" });
  }
  next();
}
