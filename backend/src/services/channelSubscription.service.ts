import type { Api } from "grammy";
import { env } from "../config/env";

// Statuses per Telegram's ChatMember union that count as "subscribed" —
// everything else (left, kicked, restricted) does not.
const SUBSCRIBED_STATUSES = new Set(["creator", "administrator", "member"]);

// getChatMember is called on essentially every authenticated request (see
// telegramAuth.ts), so a short cache avoids hammering Telegram's API on
// every click without meaningfully delaying a student who just joined —
// the bot's "Tekshirish" button and the frontend's recheck action both
// invalidate this before re-checking, so manual verification is instant.
const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { subscribed: boolean; expiresAt: number }>();

function resolveChannelId(raw: string): string | number {
  return raw.startsWith("@") ? raw : Number(raw);
}

export const channelSubscriptionEnabled = Boolean(env.CHANNEL_ID);

export function getChannelUrl(): string | null {
  if (env.CHANNEL_URL) return env.CHANNEL_URL;
  if (env.CHANNEL_ID?.startsWith("@")) return `https://t.me/${env.CHANNEL_ID.slice(1)}`;
  return null;
}

export async function isChannelSubscriber(api: Api, telegramId: bigint): Promise<boolean> {
  if (!env.CHANNEL_ID) return true;

  const key = telegramId.toString();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.subscribed;

  let subscribed: boolean;
  try {
    const member = await api.getChatMember(resolveChannelId(env.CHANNEL_ID), Number(telegramId));
    subscribed = SUBSCRIBED_STATUSES.has(member.status);
  } catch (err) {
    // Almost always a misconfiguration (wrong CHANNEL_ID, bot not a member
    // of the channel) rather than a real "not subscribed" case — fail open
    // so a config mistake can't lock every user out of the whole bot.
    console.error(`Channel subscription check failed for telegramId ${key} (failing open):`, err);
    subscribed = true;
  }

  cache.set(key, { subscribed, expiresAt: Date.now() + CACHE_TTL_MS });
  return subscribed;
}

export function invalidateChannelSubscription(telegramId: bigint) {
  cache.delete(telegramId.toString());
}
