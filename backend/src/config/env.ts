import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BOT_TOKEN: z.string().min(1, "BOT_TOKEN is required"),
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  WEBAPP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  ALLOW_DEV_AUTH: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  FRONTEND_ORIGIN: z.string().optional(),
  WEBHOOK_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  // Hard safety net: dev auth bypass can never be considered enabled in a
  // production process, regardless of what ALLOW_DEV_AUTH is set to in .env.
  allowDevAuth: raw.NODE_ENV !== "production" && raw.ALLOW_DEV_AUTH,
  adminTelegramIds: new Set(
    raw.ADMIN_TELEGRAM_IDS.split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  ),
};
