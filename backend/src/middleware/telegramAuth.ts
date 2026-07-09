import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { validateInitData } from "../utils/telegramValidate";
import { AuthenticatedUser } from "../types/express";

/**
 * role is a real, admin-manageable DB column now (see Student.role). This
 * env list is only a "break-glass" bootstrap: it force-upgrades (never
 * downgrades) a matching account to ADMIN on every request, so a
 * misconfigured/corrupted DB role can never lock out the configured
 * teacher(s). All other promotions (guest->student->admin, group
 * assignment) happen via PATCH /students/:id, admin-gated.
 */
export async function upsertStudentAndAttach(
  req: Request,
  telegramId: bigint,
  fullName: string,
  username: string | undefined
) {
  let student = await prisma.student.upsert({
    where: { telegramId },
    update: { fullName, username },
    create: { telegramId, fullName, username },
  });

  if (env.adminTelegramIds.has(telegramId.toString()) && student.role !== "ADMIN") {
    student = await prisma.student.update({
      where: { telegramId },
      data: { role: "ADMIN" },
    });
  }

  const user: AuthenticatedUser = {
    id: student.id,
    telegramId: student.telegramId,
    fullName: student.fullName,
    username: student.username,
    role: student.role.toLowerCase() as AuthenticatedUser["role"],
    groupName: student.groupName,
  };
  req.user = user;
}

/**
 * Validates the Telegram Mini App `initData` sent as
 * `Authorization: tma <initData>` on every request. No sessions/JWTs —
 * this is re-validated per request per Telegram's recommended stateless flow.
 */
export async function telegramAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, initData] = header.split(" ");

  if (scheme?.toLowerCase() !== "tma" || !initData) {
    return res.status(401).json({ error: "missing tma authorization header" });
  }

  const result = validateInitData(initData, env.BOT_TOKEN);
  if (!result.ok || !result.data) {
    return res.status(401).json({ error: result.error ?? "invalid initData" });
  }

  const { user } = result.data;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || "Foydalanuvchi";

  try {
    await upsertStudentAndAttach(req, BigInt(user.id), fullName, user.username);
    next();
  } catch (err) {
    next(err);
  }
}
