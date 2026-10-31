import axios from "axios";
import { config } from "../config/env.js";
import { LANGUAGES } from "../config/languages.js";

// Judge0 status ids: https://ce.judge0.com/statuses
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  INTERNAL_ERROR: 13,
};

const RESULT_FIELDS = "token,stdout,stderr,compile_output,message,status,time,memory";

const client = axios.create({
  baseURL: config.judge0.url,
  timeout: 15000,
  headers: buildHeaders(),
});

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (config.judge0.authToken) headers["X-Auth-Token"] = config.judge0.authToken;
  if (config.judge0.rapidApiKey) {
    headers["X-RapidAPI-Key"] = config.judge0.rapidApiKey;
    headers["X-RapidAPI-Host"] = config.judge0.rapidApiHost;
  }
  return headers;
}

const encode = (text) => Buffer.from(text ?? "", "utf8").toString("base64");
const decode = (b64) => (b64 ? Buffer.from(b64, "base64").toString("utf8") : "");

function truncate(text) {
  const max = config.limits.maxOutputChars;
  if (!text || text.length <= max) return text || "";
  return `${text.slice(0, max)}\n... [output truncated after ${max} characters]`;
}

function clamp(value, fallback, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function toJudge0Submission({ language, sourceCode, stdin, timeLimit, memoryLimit }) {
  const lang = LANGUAGES[language];
  if (!lang) throw new Error(`Unsupported language: ${language}`);

  const cpuTime = clamp(timeLimit, config.limits.defaultTimeLimitSec, config.limits.maxTimeLimitSec);
  const memoryMb = clamp(memoryLimit, config.limits.defaultMemoryLimitMb, config.limits.maxMemoryLimitMb);

  return {
    language_id: lang.judge0Id,
    source_code: encode(sourceCode),
    stdin: encode(stdin),
    cpu_time_limit: cpuTime,
    wall_time_limit: Math.min(cpuTime * 3, 20),
    memory_limit: memoryMb * 1024, // KB
    max_file_size: 1024, // KB written to disk
    max_processes_and_or_threads: language === "java" ? 64 : 16,
    enable_network: false,
    redirect_stderr_to_stdout: false,
  };
}

/** Maps Judge0's response to the shape the rest of the backend uses. */
function normalizeResult(raw) {
  const statusId = raw?.status?.id ?? STATUS.INTERNAL_ERROR;
  return {
    statusId,
    status: raw?.status?.description ?? "Unknown",
    stdout: truncate(decode(raw?.stdout)),
    stderr: truncate(decode(raw?.stderr)),
    compileOutput: truncate(decode(raw?.compile_output)),
    message: decode(raw?.message),
    time: raw?.time != null ? Number(raw.time) : null, // seconds
    memory: raw?.memory != null ? Number(raw.memory) : null, // KB
    isCompileError: statusId === STATUS.COMPILATION_ERROR,
    isTimeout: statusId === STATUS.TIME_LIMIT_EXCEEDED,
    // 7-12 are the runtime error variants (SIGSEGV, NZEC, ...).
    isRuntimeError: statusId >= 7 && statusId <= 12,
    isInternalError: statusId >= 13,
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function submitBatch(submissions) {
  const { data } = await client.post(
    "/submissions/batch",
    { submissions },
    { params: { base64_encoded: true } },
  );
  return data.map((entry) => {
    if (!entry.token) throw new Error(`Judge0 rejected a submission: ${JSON.stringify(entry)}`);
    return entry.token;
  });
}

async function pollBatch(tokens) {
  const deadline = Date.now() + config.judge0.pollTimeoutMs;
  const results = new Map();

  while (results.size < tokens.length) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for Judge0 results");
    await sleep(config.judge0.pollIntervalMs);

    const pending = tokens.filter((t) => !results.has(t));
    const { data } = await client.get("/submissions/batch", {
      params: { tokens: pending.join(","), base64_encoded: true, fields: RESULT_FIELDS },
    });
    for (const sub of data.submissions ?? []) {
      if (sub && sub.status?.id > STATUS.PROCESSING) results.set(sub.token, sub);
    }
  }
  return tokens.map((t) => results.get(t));
}

/**
 * Runs several programs (typically one source against many test inputs) and
 * returns normalized results in the same order as the input.
 */
export async function executeBatch(items) {
  const out = [];
  for (let i = 0; i < items.length; i += config.judge0.batchSize) {
    const chunk = items.slice(i, i + config.judge0.batchSize);
    const tokens = await submitBatch(chunk.map(toJudge0Submission));
    const raw = await pollBatch(tokens);
    out.push(...raw.map(normalizeResult));
  }
  return out;
}

export async function execute(item) {
  const [result] = await executeBatch([item]);
  return result;
}

export async function getJudge0Languages() {
  const { data } = await client.get("/languages");
  return data;
}

export async function pingJudge0() {
  try {
    await client.get("/about", { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
