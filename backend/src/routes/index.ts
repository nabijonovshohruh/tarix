import { Router } from "express";
import { env } from "../config/env";
import { telegramAuth } from "../middleware/telegramAuth";
import { devAuth } from "../middleware/devAuth";
import { requireRegistered } from "../middleware/requireRegistered";
import { requireChannelSubscription } from "../middleware/requireChannelSubscription";
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

// Everything below requires being subscribed to the mandatory channel, then
// a completed bot name-registration — /auth/* stays open above so the
// frontend can learn both states and render its own lock screens instead of
// a bare 403. Channel check runs first, matching the bot-side gate order.
apiRouter.use(requireChannelSubscription);
apiRouter.use(requireRegistered);

apiRouter.use(testsRouter);
apiRouter.use(attendanceRouter);
apiRouter.use(examsRouter);
apiRouter.use(studentsRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(leaderboardRouter);
