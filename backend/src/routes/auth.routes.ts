import { Router } from "express";
import { getMe } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.get("/me", getMe);
