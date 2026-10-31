import { timingSafeEqual } from "node:crypto";
import { config } from "../config/env.js";
import { HttpError } from "./errorHandler.js";

const CANDIDATE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Hackathon-grade identity: the frontend sends a stable per-browser id in
 * `x-candidate-id`. Replace with your platform's real auth (JWT/session) and
 * set req.candidateId from the verified token instead.
 */
export function requireCandidate(req, _res, next) {
  const id = req.get("x-candidate-id");
  if (!id || !CANDIDATE_ID.test(id)) {
    return next(new HttpError(401, "Missing or invalid x-candidate-id header"));
  }
  req.candidateId = id;
  next();
}

export function requireAdmin(req, _res, next) {
  if (!config.adminApiKey) {
    return next(new HttpError(403, "Admin routes are disabled (ADMIN_API_KEY is not set)"));
  }
  const given = Buffer.from(req.get("x-admin-key") || "");
  const expected = Buffer.from(config.adminApiKey);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return next(new HttpError(401, "Invalid admin key"));
  }
  next();
}
