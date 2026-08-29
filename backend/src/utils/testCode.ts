import { randomInt } from "crypto";

/** A 6-digit numeric PIN (e.g. "592041") — short enough to read off a screen and type on a phone keypad. */
export function generateTestCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
