import { webhookCallback } from "grammy";
import { bot } from "./bot";

// Constructed lazily (only when actually mounted in production) rather than
// at module load — grammy marks the bot instance as "webhook mode" as soon
// as webhookCallback() is called, which then makes bot.start() (long
// polling, used in dev) throw even though that route is never registered.
export function createBotWebhookHandler() {
  return webhookCallback(bot, "express");
}
