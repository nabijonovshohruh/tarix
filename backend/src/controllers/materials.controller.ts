import { Request, Response } from "express";
import { z } from "zod";
import { MaterialSection, MaterialSubSection } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { bot } from "../bot/bot";
import { uploadMaterialFile, deliverMaterialFile } from "../services/materialFile.service";

// subSection is only meaningful for MAVZULASHGAN_SERTIFIKAT — required
// there, forced to null for every other section. Mirrors testInputSchema's
// Period/SubCategory relationship in tests.controller.ts exactly.
function requiresSubSection(section: MaterialSection) {
  return section === "MAVZULASHGAN_SERTIFIKAT";
}

const materialUpdateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    section: z.nativeEnum(MaterialSection).optional(),
    subSection: z.nativeEnum(MaterialSubSection).nullable().optional(),
    isPremium: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  })
  .transform((data) => ({
    ...data,
    subSection: data.section && !requiresSubSection(data.section) ? null : data.subSection,
  }))
  .refine((data) => !data.section || !requiresSubSection(data.section) || data.subSection, {
    message: "subSection is required for this section",
    path: ["subSection"],
  });

// Multipart form fields arrive as strings — booleans need an explicit
// "true"/"false" comparison rather than z.coerce.boolean() (which would
// treat the literal string "false" as truthy).
const materialCreateFormSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    section: z.nativeEnum(MaterialSection),
    subSection: z.nativeEnum(MaterialSubSection).optional(),
    isPremium: z
      .string()
      .optional()
      .transform((v) => v === "true"),
  })
  .transform((data) => ({
    ...data,
    subSection: requiresSubSection(data.section) ? data.subSection ?? null : null,
  }))
  .refine((data) => !requiresSubSection(data.section) || data.subSection, {
    message: "subSection is required for this section",
    path: ["subSection"],
  });

// Same isFree/guest paywall pattern as Test.isFree (see tests.controller.ts's
// assertTopicAccess) — only the download action is gated, not viewing the
// title/description, matching the "description first" product requirement.
function assertMaterialAccess(role: string, material: { isPremium: boolean }) {
  if (role === "guest" && material.isPremium) {
    throw new HttpError(403, "Bu material faqat pullik obunachilar uchun");
  }
}

export async function listMaterials(req: Request, res: Response) {
  const isAdmin = req.user!.role === "admin";
  const includeAll = isAdmin && req.query.all === "true";
  const section = req.query.section as MaterialSection | undefined;
  const subSection = req.query.subSection as MaterialSubSection | undefined;

  const materials = await prisma.material.findMany({
    where: {
      ...(section ? { section } : {}),
      ...(subSection ? { subSection } : {}),
      ...(includeAll ? {} : { isPublished: true }),
    },
    // Oldest first — the first-uploaded item (e.g. "Mavzu 1") should appear
    // at the top of its section, matching the intended teaching sequence.
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      title: true,
      section: true,
      subSection: true,
      isPremium: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
      // description/fileId/fileName are intentionally left off the list
      // response — description shows on the detail screen, fileId/fileName
      // are never exposed to the client at all (downloads go through the
      // bot, see downloadMaterial).
    },
  });
  res.json({ materials });
}

export async function getMaterial(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const material = await prisma.material.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      section: true,
      isPremium: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!material) throw new HttpError(404, "material not found");

  const isAdmin = req.user!.role === "admin";
  if (!isAdmin && !material.isPublished) throw new HttpError(404, "material not found");

  // Description is shown regardless of premium status ("display the
  // description first") — only downloading is gated, right below.
  res.json({ material });
}

export async function createMaterial(req: Request, res: Response) {
  const body = materialCreateFormSchema.parse(req.body);
  if (!req.file) throw new HttpError(400, "fayl yuborilmadi");

  const { fileId, fileName } = await uploadMaterialFile(
    bot.api,
    req.user!.telegramId,
    req.file.buffer,
    req.file.originalname
  );

  const material = await prisma.material.create({
    data: { ...body, fileId, fileName },
  });
  res.status(201).json({ material });
}

export async function updateMaterial(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = materialUpdateSchema.parse(req.body);

  // Replacing the file is optional — re-relay through the bot only when a
  // new one is actually attached.
  let fileFields: { fileId: string; fileName: string } | undefined;
  if (req.file) {
    fileFields = await uploadMaterialFile(bot.api, req.user!.telegramId, req.file.buffer, req.file.originalname);
  }

  const material = await prisma.material.update({
    where: { id },
    data: { ...body, ...fileFields },
  });
  res.json({ material });
}

export async function deleteMaterial(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  await prisma.material.delete({ where: { id } });
  res.status(204).send();
}

export async function downloadMaterial(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const material = await prisma.material.findUnique({ where: { id } });
  if (!material || !material.isPublished) throw new HttpError(404, "material not found");

  assertMaterialAccess(req.user!.role, material);

  // file_id has no HTTP URL of its own — the only way to hand the file to
  // the student is having the bot deliver it into their own Telegram chat.
  await deliverMaterialFile(bot.api, req.user!.telegramId, material.fileId, material.title);
  res.json({ delivered: true });
}
