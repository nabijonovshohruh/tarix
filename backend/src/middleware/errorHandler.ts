import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof MulterError) {
    return res.status(400).json({ error: "Fayl hajmi juda katta yoki noto'g'ri" });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message ?? "invalid request body" });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2025: record to update/delete not found. P2003: foreign key
    // constraint failed (a relation somewhere is still ON DELETE RESTRICT).
    // Both are client-caused (bad id, or a stale reference), not server
    // bugs, so surface a clean 404/409 instead of falling through to 500.
    if (err.code === "P2025") {
      return res.status(404).json({ error: "record not found" });
    }
    if (err.code === "P2003") {
      return res.status(409).json({ error: "cannot delete: still referenced by other records" });
    }
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
