import { config } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { startWorker, usingRedis } from "./queue/executionQueue.js";

if (!usingRedis) {
  console.error("REDIS_URL is required to run a standalone worker");
  process.exit(1);
}

await connectDb();
startWorker();
console.log(`[worker] processing code-execution jobs (concurrency ${config.workerConcurrency})`);
