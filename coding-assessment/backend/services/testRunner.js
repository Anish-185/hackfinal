import { executeBatch } from "./judge0Service.js";

/** Ignores trailing whitespace on each line and trailing blank lines. */
export function normalizeOutput(text) {
  return (text ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trimEnd();
}

export function outputsMatch(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

function verdictFor(result, passed) {
  if (result.isCompileError) return "Compilation Error";
  if (result.isTimeout) return "Time Limit Exceeded";
  if (result.isRuntimeError) return "Runtime Error";
  if (result.isInternalError) return result.status;
  return passed ? "Passed" : "Wrong Answer";
}

/**
 * Runs `sourceCode` against `tests` and compares outputs.
 * Judge0 only executes code; deciding whether an answer is right happens here.
 */
export async function runTests({ challenge, language, sourceCode, tests }) {
  const executions = await executeBatch(
    tests.map((test) => ({
      language,
      sourceCode,
      stdin: test.input,
      timeLimit: challenge.timeLimit,
      memoryLimit: challenge.memoryLimit,
    })),
  );

  const results = tests.map((test, index) => {
    const exec = executions[index];
    const ranCleanly = exec.statusId === 3; // Accepted = exited normally
    const passed = ranCleanly && outputsMatch(exec.stdout, test.expectedOutput);
    return {
      index,
      group: test.group || "hidden",
      weight: test.weight ?? 1,
      passed,
      verdict: verdictFor(exec, passed),
      input: test.input,
      expectedOutput: test.expectedOutput,
      actualOutput: exec.stdout,
      stderr: exec.stderr || exec.message,
      time: exec.time,
      memory: exec.memory,
    };
  });

  const compileError = executions.find((e) => e.isCompileError)?.compileOutput || null;
  return { results, compileError };
}

/** Strips anything about non-public tests that could leak their contents. */
export function redactResult(result) {
  if (result.group === "public") return result;
  return {
    index: result.index,
    group: result.group,
    weight: result.weight,
    passed: result.passed,
    verdict: result.verdict,
    time: result.time,
    memory: result.memory,
  };
}

export function scoreResults(results) {
  const groups = {};
  let totalWeight = 0;
  let passedWeight = 0;

  for (const r of results) {
    groups[r.group] ??= { passed: 0, total: 0 };
    groups[r.group].total += 1;
    totalWeight += r.weight;
    if (r.passed) {
      groups[r.group].passed += 1;
      passedWeight += r.weight;
    }
  }

  const times = results.map((r) => r.time).filter((t) => t != null);
  const memories = results.map((r) => r.memory).filter((m) => m != null);

  return {
    score: totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0,
    passedTests: results.filter((r) => r.passed).length,
    totalTests: results.length,
    groups,
    executionTime: times.length ? Math.max(...times) : null,
    memoryUsed: memories.length ? Math.max(...memories) : null,
  };
}
