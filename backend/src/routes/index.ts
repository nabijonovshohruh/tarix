import { Router } from "express";
import { env } from "../config/env";
import { telegramAuth } from "../middleware/telegramAuth";
import { devAuth } from "../middleware/devAuth";
import { authRouter } from "./auth.routes";
import { testsRouter } from "./tests.routes";
import { attendanceRouter } from "./attendance.routes";
import { examsRouter } from "./exams.routes";
import { studentsRouter } from "./students.routes";
import { analyticsRouter } from "./analytics.routes";
import { leaderboardRouter } from "./leaderboard.routes";

export const apiRouter = Router();

// Dev-only bypass is only ever wired into the pipeline here, outside of
// production — see env.allowDevAuth (backend/src/config/env.ts).
if (env.allowDevAuth) {
  apiRouter.use(devAuth);
} else {
  apiRouter.use(telegramAuth);
}

apiRouter.use("/auth", authRouter);
apiRouter.use(testsRouter);
apiRouter.use(attendanceRouter);
apiRouter.use(examsRouter);
apiRouter.use(studentsRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(leaderboardRouter);
