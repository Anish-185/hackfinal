import mongoose from "mongoose";

const challengeScoreSchema = new mongoose.Schema(
  {
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    category: { type: String, enum: ["algorithm", "debugging"], default: "algorithm" },
    bestScore: { type: Number, default: 0 },
    bestSubmissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
    attempts: { type: Number, default: 0 },
  },
  { _id: false },
);

const assessmentSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true, index: true },
    title: { type: String, default: "Coding Assessment" },

    // practice: no timer, full AI help. assessment: timed, AI limited or disabled.
    mode: { type: String, enum: ["practice", "assessment"], default: "assessment" },
    aiPolicy: { type: String, enum: ["full", "limited", "disabled"], default: "limited" },
    maxAiHints: { type: Number, default: 3 },
    aiHintsUsed: { type: Number, default: 0 },

    durationMinutes: { type: Number, default: null },
    startedAt: { type: Date, default: Date.now },
    endsAt: { type: Date, default: null },

    challenges: { type: [challengeScoreSchema], default: [] },

    codingScore: { type: Number, default: null },
    debuggingScore: { type: Number, default: null },
    totalScore: { type: Number, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

assessmentSchema.methods.isExpired = function isExpired(graceMs = 0) {
  return Boolean(this.endsAt) && Date.now() > this.endsAt.getTime() + graceMs;
};

export const Assessment = mongoose.model("Assessment", assessmentSchema);
