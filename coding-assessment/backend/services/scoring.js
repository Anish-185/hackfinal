import { Assessment } from "../models/Assessment.js";

const average = (values) =>
  values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

/** Unattempted challenges count as 0. Categories with no challenges are null. */
export function computeAssessmentScores(assessment) {
  const byCategory = (category) =>
    assessment.challenges.filter((c) => c.category === category).map((c) => c.bestScore || 0);

  const codingScore = average(byCategory("algorithm"));
  const debuggingScore = average(byCategory("debugging"));
  const totalScore = average([codingScore, debuggingScore].filter((s) => s != null));
  return { codingScore, debuggingScore, totalScore };
}

/** Records a graded submission against its assessment, keeping the best score per challenge. */
export async function recordSubmissionScore({ assessmentId, challengeId, submissionId, score }) {
  await Assessment.updateOne(
    { _id: assessmentId, "challenges.challengeId": challengeId },
    { $inc: { "challenges.$.attempts": 1 } },
  );
  // Conditional update so concurrent submissions can't overwrite a better score.
  await Assessment.updateOne(
    {
      _id: assessmentId,
      challenges: {
        $elemMatch: {
          challengeId,
          $or: [{ bestScore: { $lt: score } }, { bestSubmissionId: { $exists: false } }],
        },
      },
    },
    {
      $set: {
        "challenges.$.bestScore": score,
        "challenges.$.bestSubmissionId": submissionId,
      },
    },
  );
}
