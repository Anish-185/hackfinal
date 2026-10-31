import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// Execution limits are keyed on candidate id + IP so one candidate can't flood Judge0
// and a single IP can't dodge the limit by rotating candidate ids.
const candidateKey = (req) => `${req.get("x-candidate-id") || "anon"}:${ipKeyGenerator(req.ip)}`;

const common = { standardHeaders: "draft-8", legacyHeaders: false };

export const apiLimiter = rateLimit({ ...common, windowMs: 15 * 60 * 1000, limit: 600 });

export const runLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: candidateKey,
  message: { error: "Too many runs. Wait a minute before running again." },
});

export const submitLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 6,
  keyGenerator: candidateKey,
  message: { error: "Too many submissions. Wait a minute before submitting again." },
});

export const aiLimiter = rateLimit({
  ...common,
  windowMs: 60 * 1000,
  limit: 8,
  keyGenerator: candidateKey,
  message: { error: "Too many AI requests. Wait a minute and try again." },
});
