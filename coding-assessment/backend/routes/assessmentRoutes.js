import { Router } from "express";
import {
  createAssessment,
  finishAssessment,
  getAssessment,
  listAssessments,
} from "../controllers/assessmentController.js";
import { requireCandidate } from "../middleware/auth.js";

const router = Router();
router.use(requireCandidate);
router.get("/", listAssessments);
router.post("/", createAssessment);
router.get("/:id", getAssessment);
router.post("/:id/finish", finishAssessment);

export default router;
