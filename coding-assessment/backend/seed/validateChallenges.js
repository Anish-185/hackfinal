// Runs every stored reference solution through Judge0 against all tests.
// Use it to check a Judge0 setup and to catch broken test data before publishing.
import { connectDb, disconnectDb } from "../config/db.js";
import { Challenge } from "../models/Challenge.js";
import { validateChallenge } from "../services/challengeGenerator.js";

await connectDb();

let failed = false;
const all = await Challenge.find().select("+hiddenTests +referenceSolutions");
for (const challenge of all) {
  const report = await validateChallenge(challenge);
  for (const [language, result] of Object.entries(report.languages)) {
    const mark = result.allPassed ? "PASS" : "FAIL";
    console.log(`${mark}  ${challenge.title} [${language}]`);
    if (!result.allPassed) {
      failed = true;
      console.log(JSON.stringify(result.error ?? result.compileError ?? result.failures, null, 2));
    }
  }
}

await disconnectDb();
process.exit(failed ? 1 : 0);
