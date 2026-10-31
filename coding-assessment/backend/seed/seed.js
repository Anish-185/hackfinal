import { connectDb, disconnectDb } from "../config/db.js";
import { Challenge } from "../models/Challenge.js";
import { challenges } from "./challenges.js";

await connectDb();

for (const challenge of challenges) {
  await Challenge.findOneAndUpdate(
    { slug: challenge.slug },
    { ...challenge, status: "published", source: "manual" },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  console.log(`seeded: ${challenge.title}`);
}

await disconnectDb();
