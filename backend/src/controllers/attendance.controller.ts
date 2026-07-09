import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import {
  startSession,
  stopSession,
  getActiveSession,
  markAttendance,
  getSessionRoster,
} from "../services/attendance.service";

const startSchema = z.object({
  title: z.string().min(1),
  durationMinutes: z.number().int().positive().max(600),
});

export async function postStartSession(req: Request, res: Response) {
  const body = startSchema.parse(req.body);
  const session = await startSession(body.title, body.durationMinutes);
  res.status(201).json({ session });
}

export async function postStopSession(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const session = await stopSession(id);
  res.json({ session });
}

export async function getActive(req: Request, res: Response) {
  const session = await getActiveSession();
  res.json({ session });
}

export async function postMark(req: Request, res: Response) {
  const sessionId = BigInt(req.params.id);
  const record = await markAttendance(sessionId, req.user!.id);
  res.status(201).json({ record });
}

export async function listSessions(req: Request, res: Response) {
  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { startTime: "desc" },
    include: { _count: { select: { records: true } } },
  });
  res.json({ sessions });
}

export async function getSessionDetail(req: Request, res: Response) {
  const id = BigInt(req.params.id);
  const roster = await getSessionRoster(id);
  res.json(roster);
}

export async function getMyAttendance(req: Request, res: Response) {
  const records = await prisma.attendanceRecord.findMany({
    where: { studentId: req.user!.id },
    include: { session: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ records });
}
