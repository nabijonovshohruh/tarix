import { NextFunction, Request, Response } from "express";
import { upsertStudentAndAttach } from "./telegramAuth";

/**
 * Dev-only auth bypass so the app can be exercised from a plain browser
 * without a real Telegram client. Only ever wired into the middleware chain
 * from app.ts inside a `NODE_ENV !== 'production'` guard — see env.allowDevAuth.
 */
export async function devAuth(req: Request, res: Response, next: NextFunction) {
  const telegramIdHeader = req.header("x-dev-telegram-id");
  if (!telegramIdHeader) {
    return res.status(401).json({ error: "missing x-dev-telegram-id (dev auth)" });
  }

  const fullName = req.header("x-dev-full-name") || `Dev User ${telegramIdHeader}`;

  try {
    // Dev identities have no bot conversation to complete, so they're
    // grandfathered as registered on creation, same as any pre-existing
    // production account — the lock only applies to genuinely new Telegram
    // Mini App visitors (see telegramAuth.ts).
    await upsertStudentAndAttach(req, BigInt(telegramIdHeader), fullName, undefined, {
      isRegisteredOnCreate: true,
    });
    next();
  } catch (err) {
    next(err);
  }
}
