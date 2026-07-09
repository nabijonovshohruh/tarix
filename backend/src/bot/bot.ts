import { Bot, Context, GrammyError, HttpError, InlineKeyboard } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

export const bot = new Bot(env.BOT_TOKEN);

const NAME_PROMPT =
  "Xush kelibsiz! \"Majburiy Tarix\" botidan foydalanish uchun avval ism va " +
  "familiyangizni to'liq holda yozib yuboring (masalan: Aliyev Vali).";

async function sendWelcome(ctx: Context) {
  if (!env.WEBAPP_URL) {
    await ctx.reply(
      "Mini App manzili sozlanmagan. Iltimos, administratorga murojaat qiling."
    );
    return;
  }

  const keyboard = new InlineKeyboard().webApp("📚 Ilovani ochish", env.WEBAPP_URL);

  await ctx.reply(
    "Assalomu alaykum! \"Majburiy Tarix\" kursiga xush kelibsiz.\n\n" +
      "Quyidagi tugma orqali testlar, davomat va imtihon bo'limlariga o'ting.",
    { reply_markup: keyboard }
  );
}

// Runs before every command/message handler. New Telegram accounts are
// created here as GUEST + unregistered, and stay locked out of every other
// command (and, via requireRegistered on the API side, the whole Mini App)
// until they reply with plain text — which is captured as their real full
// name — same one-time gate regardless of what they typed first (/start,
// /help, or anything else).
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

  if (!student.isRegistered) {
    const text = ctx.message?.text?.trim();
    const isCommand = text?.startsWith("/") ?? false;

    if (text && !isCommand) {
      if (text.length < 2 || text.length > 100) {
        await ctx.reply(
          "Ism-familiya juda qisqa yoki uzun. Iltimos, to'liq ism va familiyangizni qayta kiriting."
        );
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

bot.command("start", async (ctx) => {
  await sendWelcome(ctx);
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "/start — Mini App'ni ochish\n" +
      "Savollar bo'yicha o'qituvchingizga murojaat qiling."
  );
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
