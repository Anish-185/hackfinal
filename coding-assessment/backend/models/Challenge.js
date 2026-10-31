import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    expectedOutput: { type: String, required: true },
    explanation: { type: String, default: "" },
    // "public" tests are shown to candidates; "hidden" and "performance" never leave the backend.
    group: { type: String, enum: ["public", "hidden", "performance"], default: "hidden" },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false },
);

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true }, // Markdown
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    // "debugging" challenges ship broken starter code the candidate has to fix.
    category: { type: String, enum: ["algorithm", "debugging"], default: "algorithm" },
    skillTags: [{ type: String }],

    supportedLanguages: [{ type: String, required: true }],
    starterCode: { type: Map, of: String, default: {} },

    publicTests: { type: [testCaseSchema], default: [] },
    hiddenTests: { type: [testCaseSchema], default: [], select: false },
    referenceSolutions: { type: Map, of: String, default: {}, select: false },

    timeLimit: { type: Number, default: 2 }, // seconds
    memoryLimit: { type: Number, default: 128 }, // MB
    evaluationCriteria: [{ type: String }],

    status: { type: String, enum: ["draft", "published"], default: "published" },
    source: { type: String, enum: ["manual", "ai"], default: "manual" },
    validationReport: { type: mongoose.Schema.Types.Mixed, select: false },
  },
  { timestamps: true },
);

challengeSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Challenge = mongoose.model("Challenge", challengeSchema);
