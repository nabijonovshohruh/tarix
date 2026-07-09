import crypto from "node:crypto";

export interface TelegramInitDataUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface ParsedInitData {
  user: TelegramInitDataUser;
  authDate: number;
}

export interface ValidateResult {
  ok: boolean;
  data?: ParsedInitData;
  error?: string;
}

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // 24h freshness window

/**
 * Validates Telegram Mini App `initData` per the algorithm documented at
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string): ValidateResult {
  if (!initData) return { ok: false, error: "missing initData" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "missing hash" };
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const computedBuffer = Buffer.from(computedHash, "hex");
  if (hashBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(hashBuffer, computedBuffer)) {
    return { ok: false, error: "signature mismatch" };
  }

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    return { ok: false, error: "stale auth_date" };
  }

  const userRaw = params.get("user");
  if (!userRaw) return { ok: false, error: "missing user" };

  let user: TelegramInitDataUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return { ok: false, error: "invalid user payload" };
  }

  return { ok: true, data: { user, authDate } };
}
