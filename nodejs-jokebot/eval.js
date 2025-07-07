import Scorecard from "scorecard-ai";
import { runAndEvaluate } from "scorecard-ai/lib/runAndEvaluate";
import dotenv from "dotenv";
import fs from "fs";
import { runJokeBot } from "./system.js";

dotenv.config();

const scorecard = new Scorecard({
  apiKey: process.env.SCORECARD_API_KEY,
});

const { projectId, systemId, testsetId, metricIds } = JSON.parse(
  fs.readFileSync("eval-params.json", "utf8")
);

// Get system versions
const { versions: systemVersions } = await scorecard.systems.get(systemId);

console.log(`Running ${systemVersions.length} experiments:`);

// Run and evaluate each system version
for (const { name: systemVersionName, id: systemVersionId } of systemVersions) {
  console.log(`\tRunning ${systemVersionName}...`);
  const run = await runAndEvaluate(scorecard, {
    projectId,
    testsetId,
    metricIds,
    system: async (inputs, systemVersion) => {
      console.log(`\t\t\tRunning testcase: ${inputs.topic}...`);
      return await runJokeBot(inputs, systemVersion.config);
    },
    systemVersionId,
  });

  console.log(`\t\t${run.url}`);
}

console.log(`
✅ Done!

Try it locally:
node system.js "pizza"
`);
