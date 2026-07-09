import { Request, Response } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../middleware/errorHandler";
import { getStudentDashboard } from "../services/dashboard.service";

const updateStudentSchema = z
  .object({
    role: z.nativeEnum(Role).optional(),
    groupName: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => data.role !== "STUDENT" || (data.groupName && data.groupName.length > 0), {
    message: "groupName is required when role is student",
    path: ["groupName"],
  });

export async function getMyDashboard(req: Request, res: Response) {
  const dashboard = await getStudentDashboard(req.user!.id);
  res.json({ dashboard });
}

export async function listStudents(req: Request, res: Response) {
  const q = (req.query.q as string | undefined)?.trim();
  const students = await prisma.student.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });
  res.json({ students });
}

export async function getStudentDetail(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) throw new HttpError(404, "student not found");

  const dashboard = await getStudentDashboard(id);
  res.json({ student, dashboard });
}

export async function updateStudent(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const body = updateStudentSchema.parse(req.body);

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(body.role !== undefined ? { role: body.role } : {}),
      ...(body.groupName !== undefined ? { groupName: body.groupName } : {}),
    },
  });
  res.json({ student });
}

export async function getStudentGroups(req: Request, res: Response) {
  const rows = await prisma.student.findMany({
    where: { role: "STUDENT", groupName: { not: null } },
    select: { groupName: true },
    distinct: ["groupName"],
    orderBy: { groupName: "asc" },
  });
  res.json({ groups: rows.map((r) => r.groupName as string) });
}
