import { Assessment } from "../models/Assessment.js";
import { Challenge } from "../models/Challenge.js";
import { HttpError } from "../middleware/errorHandler.js";
import { assertObjectId } from "../middleware/validate.js";
import { computeAssessmentScores } from "../services/scoring.js";

const MAX_CHALLENGES = 10;

async function finalize(assessment) {
  Object.assign(assessment, computeAssessmentScores(assessment), {
    completed: true,
    completedAt: new Date(),
  });
  await assessment.save();
}

async function loadOwned(req) {
  assertObjectId(req.params.id, "assessment id");
  const assessment = await Assessment.findOne({ _id: req.params.id, candidateId: req.candidateId });
  if (!assessment) throw new HttpError(404, "Assessment not found");
  return assessment;
}

/**
 * POST /api/assessments — starts a practice session or a timed assessment.
 * In a full platform a recruiter would create these; here the candidate starts one.
 */
export async function createAssessment(req, res) {
  const { challengeIds, mode = "assessment", durationMinutes, aiPolicy, maxAiHints, title } = req.body;

  if (!Array.isArray(challengeIds) || challengeIds.length === 0 || challengeIds.length > MAX_CHALLENGES) {
    throw new HttpError(400, `challengeIds must contain 1-${MAX_CHALLENGES} ids`);
  }
  challengeIds.forEach((id) => assertObjectId(id, "challengeId"));
  if (!["practice", "assessment"].includes(mode)) throw new HttpError(400, "mode must be practice or assessment");

  const challenges = await Challenge.find({ _id: { $in: challengeIds }, status: "published" }).select("category");
  if (challenges.length !== new Set(challengeIds).size) throw new HttpError(400, "Unknown or unpublished challenge");
  const categoryById = new Map(challenges.map((c) => [String(c._id), c.category]));

  const isPractice = mode === "practice";
  const minutes = isPractice ? null : Math.min(Math.max(Number(durationMinutes) || 60, 5), 240);
  const startedAt = new Date();

  const assessment = await Assessment.create({
    candidateId: req.candidateId,
    title: title || (isPractice ? "Practice session" : "Coding Assessment"),
    mode,
    aiPolicy: isPractice ? "full" : ["limited", "disabled"].includes(aiPolicy) ? aiPolicy : "limited",
    maxAiHints: isPractice ? 0 : Math.min(Math.max(Number(maxAiHints) || 3, 0), 20),
    durationMinutes: minutes,
    startedAt,
    endsAt: minutes ? new Date(startedAt.getTime() + minutes * 60 * 1000) : null,
    challenges: [...new Set(challengeIds)].map((id) => ({ challengeId: id, category: categoryById.get(id) })),
  });

  res.status(201).json({ id: assessment._id });
}

/** GET /api/assessments/:id — finishes the assessment automatically once time runs out. */
export async function getAssessment(req, res) {
  const assessment = await loadOwned(req);
  if (!assessment.completed && assessment.isExpired()) await finalize(assessment);

  await assessment.populate("challenges.challengeId", "title difficulty category supportedLanguages");
  const live = assessment.completed ? {} : computeAssessmentScores(assessment);
  res.json({ ...assessment.toObject(), ...live, serverTime: new Date() });
}

export async function listAssessments(req, res) {
  const assessments = await Assessment.find({ candidateId: req.candidateId })
    .select("title mode completed totalScore startedAt endsAt")
    .sort({ startedAt: -1 })
    .limit(20);
  res.json(assessments);
}

/** POST /api/assessments/:id/finish */
export async function finishAssessment(req, res) {
  const assessment = await loadOwned(req);
  if (!assessment.completed) await finalize(assessment);
  res.json({
    id: assessment._id,
    codingScore: assessment.codingScore,
    debuggingScore: assessment.debuggingScore,
    totalScore: assessment.totalScore,
    completed: true,
  });
}
