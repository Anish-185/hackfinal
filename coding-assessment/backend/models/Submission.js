import mongoose from "mongoose";

const groupSummarySchema = new mongoose.Schema(
  { passed: Number, total: Number },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    candidateId: { type: String, required: true, index: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", index: true },

    language: { type: String, required: true },
    sourceCode: { type: String, required: true },

    status: {
      type: String,
      enum: ["queued", "running", "completed", "error"],
      default: "queued",
    },
    error: { type: String },

    passedTests: { type: Number, default: 0 },
    totalTests: { type: Number, default: 0 },
    groups: {
      public: groupSummarySchema,
      hidden: groupSummarySchema,
      performance: groupSummarySchema,
    },
    // Per-test results. Hidden/performance entries carry pass/fail and status only.
    results: { type: [mongoose.Schema.Types.Mixed], default: [] },
    compileError: { type: String },

    executionTime: { type: Number }, // slowest test, seconds
    memoryUsed: { type: Number }, // peak, KB
    score: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Submission = mongoose.model("Submission", submissionSchema);
