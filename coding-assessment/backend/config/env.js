import "dotenv/config";

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  port: int(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coding_assessment",

  // When REDIS_URL is unset, jobs run in an in-process queue (fine for local dev,
  // not for running multiple API instances).
  redisUrl: process.env.REDIS_URL || "",
  runInlineWorker: process.env.RUN_INLINE_WORKER !== "false",
  workerConcurrency: int(process.env.WORKER_CONCURRENCY, 4),

  // Protects challenge creation/generation. Leave empty to disable those routes.
  adminApiKey: process.env.ADMIN_API_KEY || "",

  judge0: {
    url: (process.env.JUDGE0_URL || "http://localhost:2358").replace(/\/+$/, ""),
    authToken: process.env.JUDGE0_AUTH_TOKEN || "",
    rapidApiKey: process.env.JUDGE0_RAPIDAPI_KEY || "",
    rapidApiHost: process.env.JUDGE0_RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com",
    batchSize: int(process.env.JUDGE0_BATCH_SIZE, 20),
    pollIntervalMs: int(process.env.JUDGE0_POLL_INTERVAL_MS, 750),
    pollTimeoutMs: int(process.env.JUDGE0_POLL_TIMEOUT_MS, 60000),
  },

  limits: {
    maxSourceBytes: int(process.env.MAX_SOURCE_BYTES, 64 * 1024),
    maxStdinBytes: int(process.env.MAX_STDIN_BYTES, 64 * 1024),
    maxOutputChars: int(process.env.MAX_OUTPUT_CHARS, 8 * 1024),
    defaultTimeLimitSec: 2,
    maxTimeLimitSec: 10,
    defaultMemoryLimitMb: 128,
    maxMemoryLimitMb: 512,
  },

  ai: {
    model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
  },
};
