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
import { certificatesRouter } from "./certificates.routes";
import { studentsRouter } from "./students.routes";
import { analyticsRouter } from "./analytics.routes";
import { leaderboardRouter } from "./leaderboard.routes";
import { materialsRouter } from "./materials.routes";

export const apiRouter = Router();

// Dev-only bypass is only ever wired into the pipeline here, outside of
// production — see env.allowDevAuth (backend/src/config/env.ts).
if (env.allowDevAuth) {
  apiRouter.use(devAuth);
} else {
  apiRouter.use(telegramAuth);
}

apiRouter.use("/auth", authRouter);

// Certificate Test is intentionally open to every bot user — no mandatory
// channel subscription, no "student" role required — so it's mounted after
// only requireRegistered (a name is still needed for the certificate PDF
// itself) and before requireChannelSubscription, letting Express fall
// through past it entirely for any request certificatesRouter handles.
// Every other feature still requires both gates, in the original order.
apiRouter.use(requireRegistered);
apiRouter.use(certificatesRouter);
apiRouter.use(requireChannelSubscription);

apiRouter.use(testsRouter);
apiRouter.use(attendanceRouter);
apiRouter.use(examsRouter);
apiRouter.use(studentsRouter);
apiRouter.use(analyticsRouter);
apiRouter.use(leaderboardRouter);
apiRouter.use(materialsRouter);
