import { app } from "./app";
import { env } from "./config/env";
import { bot } from "./bot/bot";
import { startAttendancePoller } from "./services/attendancePoller";

async function startBot() {
  try {
    if (env.isProduction && env.WEBHOOK_URL) {
      await bot.api.setWebhook(`${env.WEBHOOK_URL}/bot/webhook`);
      console.log(`Bot webhook registered at ${env.WEBHOOK_URL}/bot/webhook`);
    } else {
      await bot.api.deleteWebhook().catch(() => undefined);
      await bot.start();
      console.log("Bot started in long-polling mode");
    }
  } catch (err) {
    // A missing/invalid BOT_TOKEN shouldn't take down the whole API — the
    // Mini App can still be exercised via the dev-auth bypass without a bot.
    console.error("Bot failed to start (API server continues running):", err);
  }
}

function main() {
  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  startAttendancePoller();
  startBot();
}

main();
