// Serializes BigInt (telegram/student/test IDs) in JSON responses, since
// JSON.stringify cannot handle BigInt natively and Express's res.json uses it.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

import path from "path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";
import { createBotWebhookHandler } from "./bot/webhook";

export const app = express();

// Telegram embeds Mini Apps in an iframe (web.telegram.org) and loads its SDK
// from telegram.org — helmet's defaults (frame-ancestors 'self', script-src
// 'self', X-Frame-Options) would block both, so both are relaxed here.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "https://telegram.org"],
        "frame-ancestors": ["'self'", "https://web.telegram.org", "https://telegram.org"],
      },
    },
    frameguard: false,
  })
);
if (!env.isProduction && env.FRONTEND_ORIGIN) {
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
}
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

if (env.isProduction && env.WEBHOOK_URL) {
  app.post("/bot/webhook", createBotWebhookHandler());
}

app.use("/api", apiRouter);

// In production the built frontend is served from the same origin/process
// (see Dockerfile), so there's no separate static host and no CORS to configure.
if (env.isProduction) {
  const publicDir = path.join(__dirname, "../public");
  // Vite content-hashes every filename under /assets, so those can be cached
  // forever — but index.html must never be cached, or a device that already
  // has an old copy keeps referencing hashed JS/CSS files a later deploy has
  // since deleted, silently breaking the whole page (missing styles, blank
  // screens) until the cache expires on its own. Without this, both got the
  // same default (weak, revalidate-based) caching, which is exactly the gap
  // that lets a stale shell survive a redeploy on some clients.
  app.use(
    express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(`${path.sep}index.html`)) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    })
  );
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

app.use(errorHandler);
