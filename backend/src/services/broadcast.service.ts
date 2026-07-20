import { GrammyError, HttpError, type Api } from "grammy";
import { prisma } from "../db/prisma";

// Telegram allows roughly 30 messages/second bot-wide across different
// chats — this delay keeps us well under that (~20/sec) without needing a
// batching/queue library for what's an infrequent, admin-triggered action.
const DELAY_MS = 50;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface BroadcastResult {
  total: number;
  sent: number;
  failed: number;
}

/**
 * Copies a single already-sent message (plain text, formatted text, or
 * photo/video/document with a caption) to every Student's chat. copyMessage
 * is used instead of re-sending manually so every content type/formatting
 * is carried over generically, with no branching on message shape.
 * Per-recipient failures (most commonly: the user blocked the bot) are
 * counted, not thrown, so one bad chat can't abort the rest of the run.
 */
export async function broadcastMessage(
  api: Api,
  fromChatId: number,
  messageId: number,
  excludeTelegramId: bigint
): Promise<BroadcastResult> {
  const students = await prisma.student.findMany({
    where: { telegramId: { not: excludeTelegramId } },
    select: { telegramId: true },
  });

  let sent = 0;
  let failed = 0;

  for (const { telegramId } of students) {
    try {
      await api.copyMessage(telegramId.toString(), fromChatId, messageId);
      sent++;
    } catch (err) {
      // Never let a single recipient's failure escape this loop — a wave of
      // 403s (blocked the bot) or 400s (chat not found, deleted account) is
      // routine for a broadcast this size, not a bug, so each is logged and
      // skipped rather than allowed to throw and abort the rest of the run.
      failed++;
      if (err instanceof GrammyError) {
        console.error(
          `Broadcast: GrammyError for telegramId ${telegramId} (${err.error_code}):`,
          err.description
        );
      } else if (err instanceof HttpError) {
        console.error(`Broadcast: network error for telegramId ${telegramId}:`, err.message);
      } else {
        console.error(`Broadcast: unknown error for telegramId ${telegramId}:`, err);
      }
    }
    await sleep(DELAY_MS);
  }

  return { total: students.length, sent, failed };
}
