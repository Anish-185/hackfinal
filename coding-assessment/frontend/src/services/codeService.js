import axios from "axios";

const CANDIDATE_KEY = "coding-engine:candidateId";

function loadCandidateId() {
  try {
    const existing = localStorage.getItem(CANDIDATE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CANDIDATE_KEY, id);
    return id;
  } catch {
    // Storage blocked (private mode etc.): the id lives for this tab only.
    return crypto.randomUUID();
  }
}

export const candidateId = loadCandidateId();

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });
api.interceptors.request.use((config) => {
  config.headers["x-candidate-id"] = candidateId;
  return config;
});

export function errorMessage(error) {
  return error?.response?.data?.error || error?.message || "Something went wrong";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll(fetchOnce, isDone, { intervalMs = 800, timeoutMs = 120000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = await fetchOnce();
    if (isDone(value)) return value;
    if (Date.now() > deadline) throw new Error("Timed out waiting for the result");
    await sleep(intervalMs);
  }
}

export const codeService = {
  async listChallenges() {
    return (await api.get("/challenges")).data;
  },
  async getChallenge(id) {
    return (await api.get(`/challenges/${id}`)).data;
  },
  async listLanguages() {
    return (await api.get("/languages")).data;
  },

  async createAssessment(payload) {
    return (await api.post("/assessments", payload)).data;
  },
  async listAssessments() {
    return (await api.get("/assessments")).data;
  },
  async getAssessment(id) {
    return (await api.get(`/assessments/${id}`)).data;
  },
  async finishAssessment(id) {
    return (await api.post(`/assessments/${id}/finish`)).data;
  },

  /** Queues a run and waits for it. Resolves with the run result. */
  async runCode(payload) {
    const { jobId } = (await api.post("/code/run", payload)).data;
    const job = await poll(
      async () => (await api.get(`/code/status/${jobId}`)).data,
      (j) => j.state === "completed" || j.state === "failed",
    );
    if (job.state === "failed") throw new Error(job.error || "Execution failed");
    return job.result;
  },

  /** Queues a graded submission and waits for the score. */
  async submitCode(payload) {
    const { submissionId } = (await api.post("/code/submit", payload)).data;
    const submission = await poll(
      async () => (await api.get(`/submissions/${submissionId}`)).data,
      (s) => s.status === "completed" || s.status === "error",
      { timeoutMs: 300000 },
    );
    if (submission.status === "error") throw new Error(submission.error || "Evaluation failed");
    return submission;
  },

  async getDebugHint(payload) {
    return (await api.post("/debug", payload)).data;
  },
};
