import { Router } from "express";
import { getSubmission, listSubmissions } from "../controllers/submissionController.js";
import { requireCandidate } from "../middleware/auth.js";

const router = Router();
router.use(requireCandidate);
router.get("/", listSubmissions);
router.get("/:id", getSubmission);

export default router;
