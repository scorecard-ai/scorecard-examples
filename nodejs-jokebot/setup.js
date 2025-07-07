import Scorecard from "scorecard-ai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const scorecard = new Scorecard({
  apiKey: process.env.SCORECARD_API_KEY,
});

console.log("🎭 Setting up Joke Bot...");

/**
 * Idempotently creates a joke bot project.
 */
async function getOrCreateProject() {
  const projectName = "Joke Bot";
  for await (const project of scorecard.projects.list()) {
    if (project.name === projectName) {
      console.log(`- ${projectName} project already exists, id: ${project.id}`);
      return project;
    }
  }

  const project = await scorecard.projects.create({
    name: projectName,
    description: "A joke bot demo",
  });
  console.log(`- Created ${projectName} project, id: ${project.id}`);
  return project;
}

/**
 * Idempotently creates a testset for the joke bot with a few testcases.
 */
async function getOrCreateTestset(projectId) {
  const testsetName = "Joke Topics";
  for await (const testset of scorecard.testsets.list(projectId)) {
    if (testset.name === testsetName) {
      console.log(`- ${testsetName} testset already exists, id: ${testset.id}`);
      return testset;
    }
  }

  const testset = await scorecard.testsets.create(projectId, {
    name: testsetName,
    description: "A joke bot demo",
    jsonSchema: {
      type: "object",
      properties: {
        topic: { type: "string" },
      },
      required: ["topic"],
    },
    fieldMapping: {
      inputs: ["topic"],
      expected: [],
      metadata: [],
    },
  });
  await scorecard.testcases.create(testset.id, {
    items: ["programming", "coffee", "meetings"].map((topic) => ({
      jsonData: { topic },
    })),
  });
  console.log(`🎭 Created ${testsetName} testset, id: ${testset.id}\n`);
  return testset;
}

/**
 * Idempotently creates a system for the joke bot.
 */
async function getOrCreateSystem(projectId) {
  const systemName = "Joke Bot";
  const system = await scorecard.systems.upsert(projectId, {
    config: { model: "gpt-4.1", style: "dad-joke", temperature: 0.9 },
    description: "Bot that tells jokes",
    name: systemName,
  });
  await scorecard.systems.versions.upsert(system.id, {
    config: { model: "gpt-4.1-nano", style: "dad-joke", temperature: 0.9 },
    name: "Dad joke nano",
  });
  console.log(`- Upserted ${systemName} system, id: ${system.id}`);
  return system;
}

/**
 * Creates a "humor" metric. Note that this is not idempotent.
 */
async function createMetrics(projectId) {
  const metricName = "Humor";
  const metric = await scorecard.metrics.create(projectId, {
    name: metricName,
    evalType: "ai",
    outputType: "int",
    evalModelName: "gpt-4.1",
    promptTemplate: String.raw`You are a humor evaluator for the topic "{{ inputs.topic }}". How funny is the following joke?

    <joke>
    {{outputs.joke}}
    </joke>
    
    {{ gradingInstructionsAndExamples }}`,
  });
  console.log(`- Created ${metricName} metric, id: ${metric.id}`);
  return [metric];
}

const project = await getOrCreateProject();
const testset = await getOrCreateTestset(project.id);
const system = await getOrCreateSystem(project.id);
const metrics = await createMetrics(project.id);

// Write the created Scorecard resources to a eval-params.json file
fs.writeFileSync(
  "eval-params.json",
  JSON.stringify(
    {
      projectId: project.id,
      systemId: system.id,
      testsetId: testset.id,
      metricIds: metrics.map((m) => m.id),
    },
    null,
    2
  )
);
console.log(
  `✅ Done setting up your project! Visit: ${scorecard.baseAppURL}/projects/${project.id}`
);
