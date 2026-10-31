import { Router } from "express";
import { getRunStatus, runCode, submitCode } from "../controllers/executionController.js";
import { debugCode } from "../controllers/debugController.js";
import { requireCandidate } from "../middleware/auth.js";
import { aiLimiter, runLimiter, submitLimiter } from "../middleware/rateLimits.js";

export const codeRouter = Router();
codeRouter.use(requireCandidate);
codeRouter.post("/run", runLimiter, runCode);
codeRouter.get("/status/:jobId", getRunStatus);
codeRouter.post("/submit", submitLimiter, submitCode);

export const debugRouter = Router();
debugRouter.post("/", requireCandidate, aiLimiter, debugCode);
