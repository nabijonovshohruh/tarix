import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getMe, postRecheckSubscription } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.get("/me", getMe);
authRouter.post("/recheck-subscription", asyncHandler(postRecheckSubscription));
