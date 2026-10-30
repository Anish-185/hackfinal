// Browser-side API client. Calls go through the /api rewrite in next.config.ts.
import type { CandidateTaskView, Event, RunResult } from "./types";

export const API_BASE = "/api";

// Response shapes of backend/app/routes (not in contracts/: they are API envelopes).
export type TaskRef = { task_id: string; kind: "domain" | "dsa"; order: number };
export type SessionOut = {
  session_id: string;
  assessment_id: string;
  status: "active" | "expired" | "submitted";
  server_time: string;
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  tasks: TaskRef[];
};
export type JobView = {
  job_id: string;
  kind: "run" | "submit";
  status: "queued" | "running" | "done" | "failed";
  result: RunResult | null;
  error: string | null;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : `request failed with ${status}`);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
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
  saveFiles: (id: string, taskId: string, files: Record<string, string>) =>
    request<{ snapshot_id: number; ts: string }>("PUT", `/sessions/${id}/tasks/${taskId}/files`, { files }),
  run: (id: string, taskId: string, files: Record<string, string>) =>
    request<{ job_id: string }>("POST", `/sessions/${id}/tasks/${taskId}/run`, { files }),
  submit: (id: string) => request<{ job_id: string }>("POST", `/sessions/${id}/submit`),
  getJob: (jobId: string) => request<JobView>("GET", `/jobs/${jobId}`),
  postEvents: (id: string, events: Event[]) => request<{ accepted: number }>("POST", `/sessions/${id}/events`, events),
};
