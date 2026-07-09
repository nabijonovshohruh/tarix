import { NextFunction, Request, Response } from "express";
import { AuthenticatedUser } from "../types/express";

export function requireRole(...roles: AuthenticatedUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}
