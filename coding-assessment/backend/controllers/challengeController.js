import { Challenge } from "../models/Challenge.js";
import { HttpError } from "../middleware/errorHandler.js";
import { assertObjectId } from "../middleware/validate.js";
import { generateChallenge as generate, validateChallenge as validate } from "../services/challengeGenerator.js";

const LIST_FIELDS = "title slug difficulty category skillTags supportedLanguages source createdAt";

function slugify(text) {
  const base = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  return `${base || "challenge"}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function listChallenges(_req, res) {
  const challenges = await Challenge.find({ status: "published" }).select(LIST_FIELDS).sort({ createdAt: 1 });
  res.json(challenges);
}

/** Candidate view: hidden tests and reference solutions are excluded by the schema. */
export async function getChallenge(req, res) {
  assertObjectId(req.params.id, "challenge id");
  const challenge = await Challenge.findOne({ _id: req.params.id, status: "published" });
  if (!challenge) throw new HttpError(404, "Challenge not found");
  res.json(challenge);
}

export async function createChallenge(req, res) {
  const { title } = req.body;
  if (!title) throw new HttpError(400, "title is required");
  const challenge = await Challenge.create({ ...req.body, slug: req.body.slug || slugify(title), source: "manual" });
  res.status(201).json({ id: challenge._id, slug: challenge.slug });
}

/** Portfolio analyzer -> challenge. The analyzer only sends a profile; the engine owns the rest. */
export async function generateChallenge(req, res) {
  const { profile, difficulty, languages, category } = req.body;
  if (!profile || typeof profile !== "object") throw new HttpError(400, "profile (object) is required");

  const generated = await generate({ profile, difficulty, languages, category });
  const challenge = await Challenge.create({ ...generated, slug: slugify(generated.title) });

  res.status(201).json({
    id: challenge._id,
    title: challenge.title,
    status: challenge.status,
    supportedLanguages: challenge.supportedLanguages,
    validationReport: generated.validationReport,
  });
}

/** Re-runs the stored reference solutions against all tests. */
export async function validateChallenge(req, res) {
  assertObjectId(req.params.id, "challenge id");
  const challenge = await Challenge.findById(req.params.id).select("+hiddenTests +referenceSolutions");
  if (!challenge) throw new HttpError(404, "Challenge not found");

  const report = await validate(challenge);
  challenge.validationReport = report;
  await challenge.save();
  res.json(report);
}
