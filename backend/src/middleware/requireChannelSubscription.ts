import { NextFunction, Request, Response } from "express";

// Blocks every route except /auth/* for a Telegram account that isn't a
// member of the mandatory channel (see channelSubscription.service.ts) —
// a no-op whenever the feature is disabled (channelSubscribed always true
// in that case) or for admins, who always bypass. The frontend uses this
// error code to render a lock screen instead of the app.
export function requireChannelSubscription(req: Request, res: Response, next: NextFunction) {
  if (req.user!.role === "admin" || req.user!.channelSubscribed) return next();
  return res.status(403).json({ error: "channel_subscription_required" });
}
