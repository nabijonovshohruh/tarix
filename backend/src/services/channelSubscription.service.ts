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

function deriveUrl(id: string, explicitUrl?: string): string | null {
  if (explicitUrl) return explicitUrl;
  if (id.startsWith("@")) return `https://t.me/${id.slice(1)}`;
  return null;
}

interface RequiredChannel {
  id: string;
  url: string | null;
}

// Every configured CHANNEL_ID_n becomes a mandatory channel — a user must be
// a member of ALL of them. Omitting every one disables the whole feature
// (everyone treated as subscribed), same as the original single-channel
// behavior.
const REQUIRED_CHANNELS: RequiredChannel[] = [
  env.CHANNEL_ID ? { id: env.CHANNEL_ID, url: deriveUrl(env.CHANNEL_ID, env.CHANNEL_URL) } : null,
  env.CHANNEL_ID_2 ? { id: env.CHANNEL_ID_2, url: deriveUrl(env.CHANNEL_ID_2, env.CHANNEL_URL_2) } : null,
].filter((c): c is RequiredChannel => c !== null);

export const channelSubscriptionEnabled = REQUIRED_CHANNELS.length > 0;

export function getChannelUrls(): (string | null)[] {
  return REQUIRED_CHANNELS.map((c) => c.url);
}

export async function isChannelSubscriber(api: Api, telegramId: bigint): Promise<boolean> {
  if (REQUIRED_CHANNELS.length === 0) return true;

  const key = telegramId.toString();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.subscribed;

  let subscribed = true;
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const member = await api.getChatMember(resolveChannelId(channel.id), Number(telegramId));
      if (!SUBSCRIBED_STATUSES.has(member.status)) {
        subscribed = false;
        break;
      }
    } catch (err) {
      // Almost always a misconfiguration (wrong CHANNEL_ID, bot not a member
      // of that channel) rather than a real "not subscribed" case — fail
      // open on THIS channel so a config mistake can't lock every user out
      // of the whole bot; the other configured channels are still checked.
      console.error(
        `Channel subscription check failed for telegramId ${key} on ${channel.id} (failing open):`,
        err
      );
    }
  }

  cache.set(key, { subscribed, expiresAt: Date.now() + CACHE_TTL_MS });
  return subscribed;
}

export function invalidateChannelSubscription(telegramId: bigint) {
  cache.delete(telegramId.toString());
}
