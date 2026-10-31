import { config } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { createApp } from "./app.js";
import { startWorker, usingRedis } from "./queue/executionQueue.js";

await connectDb();

// With Redis you can run workers separately (`npm run worker`) and set RUN_INLINE_WORKER=false.
if (usingRedis && config.runInlineWorker) {
  startWorker();
  console.log("[queue] BullMQ worker running inside the API process");
} else if (!usingRedis) {
  console.log("[queue] REDIS_URL not set: using the in-process queue");
}

createApp().listen(config.port, () => {
  console.log(`[api] listening on http://localhost:${config.port}`);
});
