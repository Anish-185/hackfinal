import { Router } from "express";
import {
  createChallenge,
  generateChallenge,
  getChallenge,
  listChallenges,
  validateChallenge,
} from "../controllers/challengeController.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", listChallenges);
router.get("/:id", getChallenge);

// Admin / portfolio-analyzer integration
router.post("/", requireAdmin, createChallenge);
router.post("/generate", requireAdmin, generateChallenge);
router.post("/:id/validate", requireAdmin, validateChallenge);

export default router;
