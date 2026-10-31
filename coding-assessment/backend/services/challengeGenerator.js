import { askForJson } from "./claudeClient.js";
import { runTests } from "./testRunner.js";
import { LANGUAGE_KEYS } from "../config/languages.js";

const codeByLanguage = {
  type: "array",
  items: {
    type: "object",
    properties: {
      language: { type: "string", enum: LANGUAGE_KEYS },
      code: { type: "string" },
    },
    required: ["language", "code"],
    additionalProperties: false,
  },
};

const testCase = {
  type: "object",
  properties: {
    input: { type: "string" },
    expectedOutput: { type: "string" },
    explanation: { type: "string" },
  },
  required: ["input", "expectedOutput", "explanation"],
  additionalProperties: false,
};

const CHALLENGE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
    category: { type: "string", enum: ["algorithm", "debugging"] },
    skillTags: { type: "array", items: { type: "string" } },
    starterCode: codeByLanguage,
    referenceSolutions: codeByLanguage,
    publicTests: { type: "array", items: testCase },
    hiddenTests: { type: "array", items: testCase },
    timeLimit: { type: "number" },
    memoryLimit: { type: "integer" },
    evaluationCriteria: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "description",
    "difficulty",
    "category",
    "skillTags",
    "starterCode",
    "referenceSolutions",
    "publicTests",
    "hiddenTests",
    "timeLimit",
    "memoryLimit",
    "evaluationCriteria",
  ],
  additionalProperties: false,
};

const SYSTEM = `You design coding challenges for a technical assessment platform, tailored to a candidate's portfolio.

Every challenge is a stdin/stdout program:
- The program reads its whole input from standard input and prints the answer to standard output.
- Starter code for each language contains the complete input-parsing and output-printing harness plus one function with an empty body for the candidate to implement. For a "debugging" challenge, the function body is instead a plausible but buggy implementation (2-3 realistic bugs) that the candidate must fix.
- Java code must use "public class Main".
- Reference solutions are complete, correct programs (same harness, function implemented). They are never shown to the candidate.
- Input format, output format and constraints must be stated precisely in the description (Markdown). Include one worked example.
- Expected outputs must be exactly what a correct program prints (no trailing explanation text).
- Provide 2-3 public tests and 5-8 hidden tests. Hidden tests must cover edge cases (minimum sizes, duplicates, negative numbers, boundaries) without repeating public tests.
- Keep inputs small enough to type by hand; do not generate inputs longer than 2000 characters.
- Stay within what can be tested this way. If a portfolio skill is a framework (React, FastAPI, MongoDB...), write an algorithmic or data-processing problem themed around that domain instead.`;

function toMap(entries, allowed) {
  const map = {};
  for (const { language, code } of entries) {
    if (allowed.includes(language)) map[language] = code;
  }
  return map;
}

/**
 * Generates a challenge from a portfolio profile and validates it by running each
 * reference solution against every test. Only languages whose reference solution
 * passes everything are kept; if none pass, the challenge stays a draft.
 */
export async function generateChallenge({ profile, difficulty, languages, category }) {
  const requestedLanguages = languages?.length ? languages : LANGUAGE_KEYS;

  const prompt = `<portfolio_profile>
${JSON.stringify(profile, null, 2)}
</portfolio_profile>

Create one ${difficulty ?? "Medium"} ${category ?? "algorithm"} challenge that fits this candidate's skills.
Provide starter code and a reference solution for each of these languages: ${requestedLanguages.join(", ")}.`;

  const draft = await askForJson({ system: SYSTEM, prompt, schema: CHALLENGE_SCHEMA, effort: "high" });

  const starterCode = toMap(draft.starterCode, requestedLanguages);
  const referenceSolutions = toMap(draft.referenceSolutions, requestedLanguages);
  const publicTests = draft.publicTests.map((t) => ({ ...t, group: "public" }));
  const hiddenTests = draft.hiddenTests.map((t) => ({ ...t, group: "hidden" }));

  const challenge = {
    ...draft,
    starterCode,
    referenceSolutions,
    publicTests,
    hiddenTests,
    timeLimit: Math.min(Math.max(draft.timeLimit || 2, 1), 10),
    memoryLimit: Math.min(Math.max(draft.memoryLimit || 128, 64), 512),
  };

  const validationReport = await validateChallenge(challenge);
  const passingLanguages = Object.entries(validationReport.languages)
    .filter(([, report]) => report.allPassed && starterCode[report.language])
    .map(([language]) => language);

  return {
    ...challenge,
    supportedLanguages: passingLanguages,
    status: passingLanguages.length > 0 ? "published" : "draft",
    source: "ai",
    validationReport,
  };
}

/** Runs every reference solution against all tests (public + hidden). */
export async function validateChallenge(challenge) {
  const tests = [...challenge.publicTests, ...challenge.hiddenTests];
  const solutions =
    challenge.referenceSolutions instanceof Map
      ? Object.fromEntries(challenge.referenceSolutions)
      : challenge.referenceSolutions;

  const report = { checkedAt: new Date().toISOString(), languages: {} };
  for (const [language, sourceCode] of Object.entries(solutions ?? {})) {
    try {
      const { results, compileError } = await runTests({ challenge, language, sourceCode, tests });
      report.languages[language] = {
        language,
        allPassed: results.every((r) => r.passed),
        failures: results
          .filter((r) => !r.passed)
          .map((r) => ({ index: r.index, verdict: r.verdict, input: r.input, expected: r.expectedOutput, actual: r.actualOutput })),
        compileError,
      };
    } catch (error) {
      report.languages[language] = { language, allPassed: false, error: error.message };
    }
  }
  return report;
}
