import { Bot, Context, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { getChannelUrl, invalidateChannelSubscription, isChannelSubscriber } from "../services/channelSubscription.service";
import { broadcastMessage } from "../services/broadcast.service";

export const bot = new Bot(env.BOT_TOKEN);

const CHECK_SUBSCRIPTION_ACTION = "check_subscription";
const NOT_SUBSCRIBED_TOAST = "Siz hali kanalga a'zo bo'lmagansiz. Qo'shiling va qayta tekshiring.";

const NAME_PROMPT =
  "Xush kelibsiz! \"Tarix | Nabijonov Shohruh\" botidan foydalanish uchun avval ism va " +
  "familiyangizni to'liq holda yozib yuboring (masalan: Aliyev Vali).";

const EDIT_NAME_PROMPT =
  "Yangi ism va familiyangizni to'liq holda yozib yuboring (masalan: Aliyev Vali).";
const NAME_LENGTH_ERROR =
  "Ism-familiya juda qisqa yoki uzun. Iltimos, to'liq ism va familiyangizni qayta kiriting.";

const BROADCAST_PROMPT =
  "Barcha foydalanuvchilarga yubormoqchi bo'lgan xabaringizni yuboring " +
  "(matn, rasm, video yoki fayl bo'lishi mumkin).";
const BROADCAST_SENDING = "Yuborilmoqda, biroz kuting...";

function isAdmin(telegramId: number) {
  return env.adminTelegramIds.has(telegramId.toString());
}

function subscribeKeyboard() {
  const keyboard = new InlineKeyboard();
  const channelUrl = getChannelUrl();
  if (channelUrl) {
    keyboard.url("📢 Kanalga a'zo bo'lish", channelUrl).row();
  }
  return keyboard.text("✅ Tekshirish", CHECK_SUBSCRIPTION_ACTION);
}

async function sendSubscribePrompt(ctx: Context) {
  await ctx.reply(
    "Botdan va Mini App'dan foydalanish uchun avval kanalimizga a'zo bo'ling, so'ngra \"Tekshirish\" tugmasini bosing:",
    { reply_markup: subscribeKeyboard() }
  );
}

async function sendWelcome(ctx: Context) {
  if (!env.WEBAPP_URL) {
    await ctx.reply(
      "Mini App manzili sozlanmagan. Iltimos, administratorga murojaat qiling."
    );
    return;
  }

  const keyboard = new InlineKeyboard().webApp("📚 Ilovani ochish", env.WEBAPP_URL);

  await ctx.reply(
    "Assalomu alaykum! \"Tarix | Nabijonov Shohruh\" kursiga xush kelibsiz.\n\n" +
      "Quyidagi tugma orqali testlar, davomat va imtihon bo'limlariga o'ting.",
    { reply_markup: keyboard }
  );
}

// Mandatory channel subscription gate — runs first, before registration.
// Entirely a no-op (isChannelSubscriber always resolves true) when CHANNEL_ID
// isn't configured, so this is safe to leave wired in for deployments that
// don't use the feature.
//
// Same non-message-update guard as the registration gate below: only ever
// replies for real messages, and only ever answers the dedicated "Tekshirish"
// callback — every other update type (my_chat_member, other callback
// queries, etc.) falls through untouched so it can't break unrelated
// handlers or throw trying to message someone it shouldn't.
bot.use(async (ctx, next) => {
  const from = ctx.from;
  if (!from) return next();
  if (!ctx.message && !ctx.callbackQuery) return next();
  if (ctx.callbackQuery?.data === CHECK_SUBSCRIPTION_ACTION) return next();

  const subscribed = await isChannelSubscriber(bot.api, BigInt(from.id));
  if (subscribed) return next();

  if (ctx.message) {
    await sendSubscribePrompt(ctx);
  } else if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({ text: NOT_SUBSCRIBED_TOAST, show_alert: true });
  }
});

bot.callbackQuery(CHECK_SUBSCRIPTION_ACTION, async (ctx) => {
  const telegramId = BigInt(ctx.from.id);
  invalidateChannelSubscription(telegramId);
  const subscribed = await isChannelSubscriber(bot.api, telegramId);

  if (!subscribed) {
    await ctx.answerCallbackQuery({ text: NOT_SUBSCRIBED_TOAST, show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery({ text: "Obuna tasdiqlandi! ✅" });
  await ctx.deleteMessage().catch(() => undefined);

  const student = await prisma.student.findUnique({ where: { telegramId } });
  if (student?.isRegistered) {
    await sendWelcome(ctx);
  } else {
    await ctx.reply(NAME_PROMPT);
  }
});

// Runs before every command/message handler. New Telegram accounts are
// created here as GUEST + unregistered, and stay locked out of every other
// command (and, via requireRegistered on the API side, the whole Mini App)
// until they reply with plain text — which is captured as their real full
// name — same one-time gate regardless of what they typed first (/start,
// /help, or anything else).
//
// The registration prompt is only ever sent in response to an actual
// message (ctx.message set). Every other update type that still carries
// ctx.from — my_chat_member (includes a user blocking the bot, delivered as
// new_chat_member.status "kicked"), chat_member, callback_query, etc. — has
// no message to reply to, and blindly replying to e.g. a user who just
// blocked the bot throws an uncatchable-looking 403. Those updates just
// fall through to next() so dedicated handlers (like bot.on("my_chat_member")
// below) can deal with them without ever touching ctx.reply.
bot.use(async (ctx, next) => {
  const from = ctx.from;
  if (!from) return next();

  const telegramId = BigInt(from.id);
  let student = await prisma.student.findUnique({ where: { telegramId } });

  if (!student) {
    const fallbackName =
      [from.first_name, from.last_name].filter(Boolean).join(" ").trim() || "Foydalanuvchi";
    student = await prisma.student.create({
      data: {
        telegramId,
        username: from.username,
        fullName: fallbackName,
        role: "GUEST",
        isRegistered: false,
      },
    });
  }

  if (!student.isRegistered && ctx.message) {
    const text = ctx.message.text?.trim();
    const isCommand = text?.startsWith("/") ?? false;

    if (text && !isCommand) {
      if (text.length < 2 || text.length > 100) {
        await ctx.reply(NAME_LENGTH_ERROR);
        return;
      }

      await prisma.student.update({
        where: { telegramId },
        data: { fullName: text, isRegistered: true },
      });
      await ctx.reply("Rahmat! Ro'yxatdan muvaffaqiyatli o'tdingiz.");
      await sendWelcome(ctx);
      return;
    }

    await ctx.reply(NAME_PROMPT);
    return;
  }

  return next();
});

// /editname conversation gate — runs after registration, so it only ever
// sees already-registered users. Mirrors the registration gate's pattern:
// a boolean column (awaitingNameEdit) tracks whether we're mid-conversation,
// so it survives process restarts. If the user sends a command instead of a
// name while the flow is active, the flow is silently cancelled and the
// command proceeds normally rather than swallowing it forever.
bot.use(async (ctx, next) => {
  const from = ctx.from;
  if (!from || !ctx.message) return next();

  const telegramId = BigInt(from.id);
  const student = await prisma.student.findUnique({ where: { telegramId } });
  if (!student?.awaitingNameEdit) return next();

  const text = ctx.message.text?.trim();
  const isCommand = text?.startsWith("/") ?? false;

  if (!text || isCommand) {
    await prisma.student.update({ where: { telegramId }, data: { awaitingNameEdit: false } });
    return next();
  }

  if (text.length < 2 || text.length > 100) {
    await ctx.reply(NAME_LENGTH_ERROR);
    return;
  }

  await prisma.student.update({
    where: { telegramId },
    data: { fullName: text, awaitingNameEdit: false },
  });
  await ctx.reply(`Ism-familiyangiz muvaffaqiyatli o'zgartirildi: ${text}`);
});

// /sendall conversation gate — admin-only (env.adminTelegramIds), same
// one-boolean-per-flow pattern as the editname gate above. Captures the
// admin's next message verbatim (any kind: text, formatted text, photo/
// video/document with caption) as the broadcast source and fans it out via
// broadcastMessage, which uses copyMessage so no content branching is
// needed here.
bot.use(async (ctx, next) => {
  const from = ctx.from;
  if (!from || !ctx.message) return next();
  if (!isAdmin(from.id)) return next();

  const telegramId = BigInt(from.id);
  const student = await prisma.student.findUnique({ where: { telegramId } });
  if (!student?.awaitingBroadcast) return next();

  const text = ctx.message.text?.trim();
  const isCommand = text?.startsWith("/") ?? false;

  if (isCommand) {
    await prisma.student.update({ where: { telegramId }, data: { awaitingBroadcast: false } });
    return next();
  }

  await prisma.student.update({ where: { telegramId }, data: { awaitingBroadcast: false } });
  await ctx.reply(BROADCAST_SENDING);

  const fromChatId = ctx.chat!.id;
  const messageId = ctx.message.message_id;

  // Deliberately not awaited: in production this middleware runs inside
  // grammy's webhookCallback, which rejects with "Request timed out after
  // 10000 ms" if bot.handleUpdate() (this whole middleware chain) doesn't
  // finish within ~10s (see bot/webhook.ts). Broadcasting to hundreds of
  // users — each with its own per-message delay (see broadcast.service.ts)
  // — easily takes far longer than that, so awaiting it here would block
  // the webhook's response past the timeout on every single run. Instead,
  // acknowledge the webhook now and keep broadcasting after this middleware
  // returns; the final summary is sent as a separate message once done.
  broadcastMessage(bot.api, fromChatId, messageId, telegramId)
    .then(({ sent, failed }) =>
      bot.api.sendMessage(
        fromChatId,
        `Xabar jami ${sent} ta foydalanuvchiga muvaffaqiyatli yuborildi.` +
          (failed > 0 ? `\n${failed} ta foydalanuvchiga yuborib bo'lmadi.` : "")
      )
    )
    .catch((err) => {
      console.error("Broadcast run failed unexpectedly:", err);
    });
});

bot.command("start", async (ctx) => {
  await sendWelcome(ctx);
});

bot.command("editname", async (ctx) => {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);
  await prisma.student.update({
    where: { telegramId },
    data: { awaitingNameEdit: true },
  });
  await ctx.reply(EDIT_NAME_PROMPT);
});

bot.command("sendall", async (ctx) => {
  if (!ctx.from || !isAdmin(ctx.from.id)) return;
  const telegramId = BigInt(ctx.from.id);
  await prisma.student.update({
    where: { telegramId },
    data: { awaitingBroadcast: true },
  });
  await ctx.reply(BROADCAST_PROMPT);
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "/start — Mini App'ni ochish\n" +
      "/editname — Ism-familiyangizni o'zgartirish\n" +
      "Savollar bo'yicha o'qituvchingizga murojaat qiling."
  );
});

// A user blocking the bot arrives as a my_chat_member update with
// new_chat_member.status === "kicked" — never attempt to message them here;
// there's nothing to send a "kicked" user and Telegram will reject it with a
// 403. Other transitions (rejoining, being restricted, etc.) currently need
// no action.
bot.on("my_chat_member", async (ctx) => {
  const status = ctx.myChatMember.new_chat_member.status;
  if (status === "kicked") {
    return;
  }
});

// Central error boundary for every update-processing error (per-update
// handler throws, failed API calls like replying to a user who has blocked
// the bot, network blips, etc). Without this, grammy's default behavior is
// to rethrow, which crashes the whole Node process — logging here instead
// keeps the bot (and the API server sharing this process) alive.
bot.catch((err) => {
  const ctx = err.ctx;
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error(`GrammyError while handling update ${ctx.update.update_id}:`, e.description);
  } else if (e instanceof HttpError) {
    console.error(`HttpError (network) while handling update ${ctx.update.update_id}:`, e.message);
  } else {
    console.error(`Unknown error while handling update ${ctx.update.update_id}:`, e);
  }
});
