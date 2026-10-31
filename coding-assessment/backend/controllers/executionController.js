import { Challenge } from "../models/Challenge.js";
import { Assessment } from "../models/Assessment.js";
import { Submission } from "../models/Submission.js";
import { enqueue, getJob } from "../queue/executionQueue.js";
import { HttpError } from "../middleware/errorHandler.js";
import { assertLanguage, assertObjectId, assertSource, assertStdin } from "../middleware/validate.js";

const SUBMIT_GRACE_MS = 30 * 1000;

async function loadChallengeForLanguage(challengeId, language) {
  assertObjectId(challengeId, "challengeId");
  const challenge = await Challenge.findOne({ _id: challengeId, status: "published" });
  if (!challenge) throw new HttpError(404, "Challenge not found");
  if (!challenge.supportedLanguages.includes(language)) {
    throw new HttpError(400, `This challenge does not support ${language}`);
  }
  return challenge;
}

/** POST /api/code/run — runs against custom input or the public sample tests. */
export async function runCode(req, res) {
  const { challengeId, language, sourceCode, stdin, useCustomInput } = req.body;
  assertLanguage(language);
  assertSource(sourceCode);
  assertStdin(stdin);
  if (challengeId) await loadChallengeForLanguage(challengeId, language);

  const jobId = await enqueue("run", {
    candidateId: req.candidateId,
    challengeId: challengeId || null,
    language,
    sourceCode,
    stdin: stdin ?? "",
    useCustomInput: Boolean(useCustomInput) || !challengeId,
  });
  res.status(202).json({ jobId });
}

/** GET /api/code/status/:jobId */
export async function getRunStatus(req, res) {
  const job = await getJob(req.params.jobId);
  if (!job || job.owner !== req.candidateId) throw new HttpError(404, "Job not found or expired");
  res.json({ jobId: job.id, state: job.state, result: job.result, error: job.error });
}

/** POST /api/code/submit — grades against public + hidden tests. */
export async function submitCode(req, res) {
  const { challengeId, language, sourceCode, assessmentId } = req.body;
  assertLanguage(language);
  assertSource(sourceCode);
  await loadChallengeForLanguage(challengeId, language);

  if (assessmentId) {
    assertObjectId(assessmentId, "assessmentId");
    const assessment = await Assessment.findOne({ _id: assessmentId, candidateId: req.candidateId });
    if (!assessment) throw new HttpError(404, "Assessment not found");
    if (assessment.completed) throw new HttpError(409, "This assessment is already finished");
    if (assessment.isExpired(SUBMIT_GRACE_MS)) throw new HttpError(409, "Time is up for this assessment");
    if (!assessment.challenges.some((c) => String(c.challengeId) === String(challengeId))) {
      throw new HttpError(400, "Challenge is not part of this assessment");
    }
  }

  const submission = await Submission.create({
    candidateId: req.candidateId,
    challengeId,
    assessmentId: assessmentId || undefined,
    language,
    sourceCode,
  });
  await enqueue("submit", { candidateId: req.candidateId, submissionId: String(submission._id) });

  res.status(202).json({ submissionId: submission._id });
}
