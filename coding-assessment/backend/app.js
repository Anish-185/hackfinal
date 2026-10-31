import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { LANGUAGES } from "./config/languages.js";
import { usingRedis } from "./queue/executionQueue.js";
import { pingJudge0 } from "./services/judge0Service.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import { codeRouter, debugRouter } from "./routes/executionRoutes.js";
import { apiLimiter } from "./middleware/rateLimits.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin.split(",").map((o) => o.trim()) }));
  app.use(express.json({ limit: "256kb" }));
  app.use("/api", apiLimiter);

  app.get("/api/health", async (_req, res) => {
    res.json({ ok: true, queue: usingRedis ? "redis" : "in-process", judge0: await pingJudge0() });
  });

  app.get("/api/languages", (_req, res) => {
    res.json(Object.entries(LANGUAGES).map(([id, l]) => ({ id, label: l.label, monaco: l.monaco })));
  });

  app.use("/api/challenges", challengeRoutes);
  app.use("/api/code", codeRouter);
  app.use("/api/debug", debugRouter);
  app.use("/api/submissions", submissionRoutes);
  app.use("/api/assessments", assessmentRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
