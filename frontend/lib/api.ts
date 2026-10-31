// Browser-side API client. Calls go through the /api rewrite in next.config.ts.
import type { CandidateTaskView, Event, RunResult, ScoreBreakdown } from "./types";

export const API_BASE = "/api";

// Response shapes of backend/app/routes (not in contracts/: they are API envelopes).
export type TaskRef = { task_id: string; kind: "domain" | "dsa"; order: number };
export type SessionOut = {
  session_id: string;
  assessment_id: string;
  tier: "novice" | "adept" | "master"; // Adept and Master have the hint assistant
  status: "active" | "expired" | "submitted";
  server_time: string;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  tasks: TaskRef[];
};
export type SavedFiles = {
  snapshot_id: number | null;
  ts: string | null;
  files: Record<string, string> | null; // null: nothing saved yet
};
export type JobView = {
  job_id: string;
  kind: "run" | "submit";
  status: "queued" | "running" | "done" | "failed";
  result: RunResult | null;
  error: string | null;
};

export type HintStatus = {
  level: number; // the next hint's level: 1 concept, 2 function, 3 line
  used: number;
  left: number;
  next_allowed_ms: number; // server time; 0 when a hint can be asked now
  rises_after_run: boolean;
};
export type HintOut = { reply: string; level: number; refused: boolean; blocked: boolean; status: HintStatus };

// GET /sessions/{id}/trail (recruiter key): report-only, never part of the score.
export type TrailNode = {
  id: string; // "path::qualname", or "path" for code outside functions
  file: string;
  name: string;
  target: boolean;
  start: number | null;
  end: number | null;
  dwell_ms: number;
};
export type TrailVisit = { node: string; start_ms: number; end_ms: number; after_hint: boolean };
export type TrailMetrics = {
  time_to_target_ms: number | null;
  off_path_ms: number;
  found: "independent" | "after_hint" | "not_found";
  edit_precision: number | null;
  lines_changed: number;
  functions_visited: number;
  hints: number;
};
export type TaskTrail = {
  task_id: string;
  kind: string;
  targets: string[];
  files: string[];
  nodes: TrailNode[];
  edges: [string, string][];
  visits: TrailVisit[];
  edits: { ts: number; node: string; chars: number }[];
  hints: { ts: number; level: number; blocked: boolean }[];
  metrics: TrailMetrics;
  first_ms: number | null;
  last_ms: number | null;
};
export type TrailOut = { session_id: string; tasks: TaskTrail[] };

export type ScoreOut = {
  status: "in_progress" | "grading" | "graded"; // in_progress: not submitted yet
  computed_at: string | null;
  breakdown: ScoreBreakdown | null;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `request failed with ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.detail ?? res.statusText);
  }
  return res.json();
}

export const api = {
  getSession: (id: string) => request<SessionOut>("GET", `/sessions/${id}`),
  getTask: (id: string, taskId: string) => request<CandidateTaskView>("GET", `/sessions/${id}/tasks/${taskId}`),
  getFiles: (id: string, taskId: string) => request<SavedFiles>("GET", `/sessions/${id}/tasks/${taskId}/files`),
  saveFiles: (id: string, taskId: string, files: Record<string, string>) =>
    request<{ snapshot_id: number; ts: string }>("PUT", `/sessions/${id}/tasks/${taskId}/files`, { files }),
  run: (id: string, taskId: string, files: Record<string, string>) =>
    request<{ job_id: string }>("POST", `/sessions/${id}/tasks/${taskId}/run`, { files }),
  submit: (id: string) => request<{ job_id: string }>("POST", `/sessions/${id}/submit`),
  getJob: (jobId: string) => request<JobView>("GET", `/jobs/${jobId}`),
  postEvents: (id: string, events: Event[]) => request<{ accepted: number }>("POST", `/sessions/${id}/events`, events),
  getScore: (id: string) => request<ScoreOut>("GET", `/sessions/${id}/score`),
  regrade: (id: string) => request<ScoreBreakdown>("POST", `/sessions/${id}/regrade`),
  getTrail: (id: string, recruiterKey: string) =>
    request<TrailOut>("GET", `/sessions/${id}/trail`, undefined, { "X-Recruiter-Key": recruiterKey }),
  hintStatus: (id: string, taskId: string) => request<HintStatus>("GET", `/sessions/${id}/tasks/${taskId}/hints`),
  hint: (id: string, taskId: string, question: string) =>
    request<HintOut>("POST", `/sessions/${id}/tasks/${taskId}/hint`, { question }),
};
