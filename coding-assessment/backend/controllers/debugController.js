import { Assessment } from "../models/Assessment.js";
import { Challenge } from "../models/Challenge.js";
import { explainError } from "../services/aiDebugger.js";
import { HttpError } from "../middleware/errorHandler.js";
import { assertLanguage, assertObjectId, assertSource } from "../middleware/validate.js";

const MAX_ERROR_CHARS = 8000;

/**
 * Finds the rules that apply to this candidate right now. An unfinished timed
 * assessment always wins, so leaving out assessmentId can't unlock practice-level help.
 */
async function resolvePolicy(candidateId, assessmentId) {
  const now = new Date();
  const active = await Assessment.findOne({
    candidateId,
    mode: "assessment",
    completed: false,
    $or: [{ endsAt: null }, { endsAt: { $gt: now } }],
  }).sort({ startedAt: -1 });

  const assessment =
    active ?? (assessmentId ? await Assessment.findOne({ _id: assessmentId, candidateId }) : null);
  if (!assessment || assessment.mode === "practice") return { policy: "full", assessment: null };
  return { policy: assessment.aiPolicy, assessment };
}

/** POST /api/debug */
export async function debugCode(req, res) {
  const { language, sourceCode, error, challengeId, assessmentId } = req.body;
  assertLanguage(language);
  assertSource(sourceCode);
  if (typeof error !== "string" || !error.trim()) throw new HttpError(400, "error is required");
  if (assessmentId) assertObjectId(assessmentId, "assessmentId");

  const { policy, assessment } = await resolvePolicy(req.candidateId, assessmentId);
  if (policy === "disabled") throw new HttpError(403, "AI hints are disabled for this assessment");

  let reserved = false;
  if (policy === "limited") {
    // Reserve a hint atomically so parallel requests can't exceed the quota.
    const updated = await Assessment.findOneAndUpdate(
      { _id: assessment._id, $expr: { $lt: ["$aiHintsUsed", "$maxAiHints"] } },
      { $inc: { aiHintsUsed: 1 } },
      { returnDocument: "after" },
    );
    if (!updated) throw new HttpError(429, "You have used all AI hints for this assessment");
    reserved = true;
  }

  let challenge = null;
  if (challengeId) {
    assertObjectId(challengeId, "challengeId");
    challenge = await Challenge.findById(challengeId).select("title description");
  }

  try {
    const hint = await explainError({
      language,
      sourceCode,
      error: error.slice(0, MAX_ERROR_CHARS),
      challenge,
      policy,
    });
    const remaining = assessment ? Math.max(assessment.maxAiHints - assessment.aiHintsUsed - (reserved ? 1 : 0), 0) : null;
    res.json({ ...hint, policy, hintsRemaining: policy === "limited" ? remaining : null });
  } catch (err) {
    if (reserved) await Assessment.updateOne({ _id: assessment._id }, { $inc: { aiHintsUsed: -1 } });
    throw err;
  }
}
