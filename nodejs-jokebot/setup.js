import Scorecard from "scorecard-ai";
import dotenv from "dotenv";
import { createInterface } from "readline/promises";
import fs from "fs";

dotenv.config();

// Helper function to prompt user input
const prompt = async (question, defaultValue = "") => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await rl.question(
    `${question} ${defaultValue ? `(default: ${defaultValue}) ` : ""}: `
  );
  rl.close();
  return answer.trim() || defaultValue;
};

// Check if eval-params.json already exists
if (fs.existsSync("eval-params.json")) {
  console.log("⚠️  eval-params.json already exists!");
  console.log(
    "Running setup again will create new resources and overwrite the existing file.\n"
  );

  const answer = await prompt("Are you sure you want to continue? (y/N)", "N");

  if (answer.toLowerCase() !== "y" && answer.toLowerCase() !== "yes") {
    console.log("Setup cancelled.");
    process.exit(0);
  }
  console.log("");
}

const sc = new Scorecard({
  apiKey: process.env.SCORECARD_API_KEY,
});

console.log("🎭 Setting up Joke Bot...\n");

// Prompt for project name
const projectName = await prompt("Enter project name", "joke bot demo");

// Create a project
const project = await sc.projects.create({
  name: projectName,
  description: "A joke bot demo",
});
console.log(`📁 Project ID: ${project.id}\n`);

// Create the system
const system = await sc.systems.create(project.id, {
  name: "Joke Bot",
  description: "A joke bot demo",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string" },
    },
    required: ["topic"],
  },
  configSchema: {
    type: "object",
    properties: {
      model: { type: "string" },
      style: {
        type: "string",
        enum: ["witty", "dad-joke"], // TODO: add more styles
      },
      temperature: {
        type: "number",
        minimum: 0,
        maximum: 2,
      },
    },
    required: ["model"],
  },
  outputSchema: {
    type: "object",
    properties: {
      joke: { type: "string" },
    },
    required: ["joke"],
  },
});

// Create two configs to compare
const configA = await sc.systemConfigs.create(system.id, {
  name: "GPT-4.1-nano - Witty",
  systemId: system.id,
  config: {
    model: "gpt-4.1-nano",
    style: "witty",
    temperature: 0.7,
  },
});

const configB = await sc.systemConfigs.create(system.id, {
  name: "GPT-4.1 - Dad Jokes",
  systemId: system.id,
  config: {
    model: "gpt-4.1",
    style: "dad-joke",
    temperature: 0.9,
  },
});

// Create test cases
const testset = await sc.testsets.create(project.id, {
  name: "Joke Topics",
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

await sc.testcases.create(testset.id, {
  items: ["programming", "coffee", "meetings"].map((topic) => ({
    jsonData: { topic },
  })),
});

// maybe write this to a eval-params.json file
fs.writeFileSync(
  "eval-params.json",
  JSON.stringify(
    {
      projectId: project.id,
      systemId: system.id,
      configAId: configA.id,
      configBId: configB.id,
      testsetId: testset.id,
      metricIds: [],
    },
    null,
    2
  )
);
console.log(
  `✅ Done setting up your project! Visit: https://app.scorecard.io/projects/${project.id}`,
  {
    projectId: project.id,
    systemId: system.id,
    configAId: configA.id,
    configBId: configB.id,
    testsetId: testset.id,
  }
);
