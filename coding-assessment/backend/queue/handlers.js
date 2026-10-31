import { Challenge } from "../models/Challenge.js";
import { Submission } from "../models/Submission.js";
import { execute } from "../services/judge0Service.js";
import { runTests, redactResult, scoreResults } from "../services/testRunner.js";
import { recordSubmissionScore } from "../services/scoring.js";

/** "Run": custom input, or the public sample tests. Never graded. */
async function handleRun({ challengeId, language, sourceCode, stdin, useCustomInput }) {
  const challenge = challengeId ? await Challenge.findById(challengeId) : null;

  if (useCustomInput || !challenge) {
    const result = await execute({
      language,
      sourceCode,
      stdin: stdin ?? "",
      timeLimit: challenge?.timeLimit,
      memoryLimit: challenge?.memoryLimit,
    });
    return { mode: "custom", stdin: stdin ?? "", ...result };
  }

  const tests = challenge.publicTests.map((t) => ({ ...t.toObject(), group: "public" }));
  const { results, compileError } = await runTests({ challenge, language, sourceCode, tests });
  const summary = scoreResults(results);
  return {
    mode: "tests",
    compileError,
    results,
    passedTests: summary.passedTests,
    totalTests: summary.totalTests,
    executionTime: summary.executionTime,
    memoryUsed: summary.memoryUsed,
  };
}

/** "Submit": every test, scored and persisted. */
async function handleSubmit({ submissionId }) {
  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error(`Submission ${submissionId} not found`);

  try {
    submission.status = "running";
    await submission.save();

    const challenge = await Challenge.findById(submission.challengeId).select("+hiddenTests");
    if (!challenge) throw new Error("Challenge no longer exists");

    const tests = [
      ...challenge.publicTests.map((t) => ({ ...t.toObject(), group: "public" })),
      ...challenge.hiddenTests.map((t) => ({ ...t.toObject(), group: t.group === "performance" ? "performance" : "hidden" })),
    ];

    const { results, compileError } = await runTests({
      challenge,
      language: submission.language,
      sourceCode: submission.sourceCode,
      tests,
    });
    const summary = scoreResults(results);

    Object.assign(submission, summary, {
      results: results.map(redactResult),
      compileError,
      status: "completed",
    });
    await submission.save();

    if (submission.assessmentId) {
      await recordSubmissionScore({
        assessmentId: submission.assessmentId,
        challengeId: submission.challengeId,
        submissionId: submission._id,
        score: summary.score,
      });
    }
    return { submissionId: String(submission._id), score: summary.score };
  } catch (error) {
    submission.status = "error";
    submission.error = error.message;
    await submission.save();
    throw error;
  }
}

export const handlers = {
  run: handleRun,
  submit: handleSubmit,
};
