import { Bot, InlineKeyboard } from "grammy";
import { env } from "../config/env";

export const bot = new Bot(env.BOT_TOKEN);

bot.command("start", async (ctx) => {
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
});

bot.command("help", async (ctx) => {
  await ctx.reply(
    "/start — Mini App'ni ochish\n" +
      "Savollar bo'yicha o'qituvchingizga murojaat qiling."
  );
});

bot.catch((err) => {
  console.error("Bot error:", err.error);
});
