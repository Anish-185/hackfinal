import { Submission } from "../models/Submission.js";
import { HttpError } from "../middleware/errorHandler.js";
import { assertObjectId } from "../middleware/validate.js";

export async function getSubmission(req, res) {
  assertObjectId(req.params.id, "submission id");
  const submission = await Submission.findOne({ _id: req.params.id, candidateId: req.candidateId });
  if (!submission) throw new HttpError(404, "Submission not found");
  res.json(submission);
}

/** GET /api/submissions?challengeId=&assessmentId= — the candidate's own history, newest first. */
export async function listSubmissions(req, res) {
  const filter = { candidateId: req.candidateId };
  for (const key of ["challengeId", "assessmentId"]) {
    if (req.query[key]) {
      assertObjectId(req.query[key], key);
      filter[key] = req.query[key];
    }
  }
  const submissions = await Submission.find(filter)
    .select("challengeId assessmentId language status score passedTests totalTests createdAt")
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(submissions);
}
