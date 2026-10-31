import { randomUUID } from "node:crypto";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "../config/env.js";
import { handlers } from "./handlers.js";

const QUEUE_NAME = "code-execution";
const RESULT_TTL_SECONDS = 60 * 60;

async function runJob(type, data) {
  const handler = handlers[type];
  if (!handler) throw new Error(`Unknown job type: ${type}`);
  return handler(data);
}

/* ----------------------------- Redis / BullMQ ----------------------------- */

let connection;
let queue;

function getConnection() {
  // BullMQ needs maxRetriesPerRequest: null for blocking worker connections.
  connection ??= new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
  return connection;
}

function getQueue() {
  queue ??= new Queue(QUEUE_NAME, {
    connection: getConnection(),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: RESULT_TTL_SECONDS },
      removeOnFail: { age: RESULT_TTL_SECONDS },
    },
  });
  return queue;
}

const BULL_STATE = {
  waiting: "queued",
  delayed: "queued",
  prioritized: "queued",
  "waiting-children": "queued",
  active: "running",
  completed: "completed",
  failed: "failed",
};

const redisBackend = {
  async enqueue(type, data) {
    const job = await getQueue().add(type, data, { jobId: randomUUID() });
    return job.id;
  },
  async getJob(id) {
    const job = await getQueue().getJob(id);
    if (!job) return null;
    const state = BULL_STATE[await job.getState()] ?? "queued";
    return {
      id: job.id,
      type: job.name,
      owner: job.data.candidateId,
      state,
      result: state === "completed" ? job.returnvalue : null,
      error: state === "failed" ? job.failedReason : null,
    };
  },
  startWorker() {
    const worker = new Worker(QUEUE_NAME, (job) => runJob(job.name, job.data), {
      connection: getConnection(),
      concurrency: config.workerConcurrency,
    });
    worker.on("failed", (job, err) => console.error(`[queue] job ${job?.id} failed: ${err.message}`));
    return worker;
  },
};

/* --------------------------- In-process fallback -------------------------- */

const memoryJobs = new Map();
const pending = [];
let active = 0;

function pump() {
  while (active < config.workerConcurrency && pending.length > 0) {
    const job = pending.shift();
    active += 1;
    job.state = "running";
    runJob(job.type, job.data)
      .then((result) => Object.assign(job, { state: "completed", result }))
      .catch((err) => {
        console.error(`[queue] job ${job.id} failed: ${err.message}`);
        Object.assign(job, { state: "failed", error: err.message });
      })
      .finally(() => {
        active -= 1;
        setTimeout(() => memoryJobs.delete(job.id), RESULT_TTL_SECONDS * 1000).unref();
        pump();
      });
  }
}

const memoryBackend = {
  async enqueue(type, data) {
    const job = { id: randomUUID(), type, data, state: "queued", result: null, error: null };
    memoryJobs.set(job.id, job);
    pending.push(job);
    pump();
    return job.id;
  },
  async getJob(id) {
    const job = memoryJobs.get(id);
    if (!job) return null;
    const { data, ...rest } = job;
    return { ...rest, owner: data.candidateId };
  },
  startWorker() {
    return null; // jobs run as soon as they're enqueued
  },
};

/* --------------------------------- Exports -------------------------------- */

const backend = config.redisUrl ? redisBackend : memoryBackend;

export const usingRedis = Boolean(config.redisUrl);
export const enqueue = (type, data) => backend.enqueue(type, data);
export const getJob = (id) => backend.getJob(id);
export const startWorker = () => backend.startWorker();
