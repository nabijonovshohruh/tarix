import { webhookCallback } from "grammy";
import { Request, Response } from "express";
import { bot } from "./bot";

// Constructed lazily (only when actually mounted in production) rather than
// at module load — grammy marks the bot instance as "webhook mode" as soon
// as webhookCallback() is called, which then makes bot.start() (long
// polling, used in dev) throw even though that route is never registered.
export function createBotWebhookHandler() {
  // onTimeout: "return" makes a slow update degrade gracefully (grammy just
  // ends the HTTP response and lets bot.handleUpdate keep running detached)
  // instead of the default "throw", which rejects with "Request timed out
  // after 10000 ms" — a rejection Express 4 does not catch for async route
  // handlers, which becomes an unhandled promise rejection and crashes the
  // whole Node process by default. The /sendall broadcast no longer blocks
  // this middleware chain (see bot.ts), so this is a defensive backstop, not
  // the primary fix, for any future handler that ends up slow.
  const handler = webhookCallback(bot, "express", {
    onTimeout: "return",
    timeoutMilliseconds: 10_000,
  });

  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error("Bot webhook handler error:", err);
      if (!res.headersSent) {
        res.sendStatus(200);
      }
    }
  };
}
