import { randomInt } from "crypto";

/** "NS{YY} {6 digits}" (e.g. "NS26 846147") — NS for Nabijonov Shohruh, replacing the government "UZ" prefix on the original certificate this format is modeled after. */
export function generateCertificateNumberCandidate(year: number): string {
  const yy = String(year % 100).padStart(2, "0");
  const digits = randomInt(0, 1_000_000).toString().padStart(6, "0");
  return `NS${yy} ${digits}`;
}
