import Scorecard from 'scorecard-ai';
import { runAndEvaluate } from 'scorecard-ai/lib/runAndEvaluate';
import dotenv from 'dotenv';
import fs from 'fs';
import { runJokeBot } from './system.js';

dotenv.config();

const sc = new Scorecard({
  apiKey: process.env.SCORECARD_API_KEY,
});

const {
  projectId,
  systemId,
  testsetId,
  metricIds = [],
  configAId,
  configBId,
} = JSON.parse(fs.readFileSync('eval-params.json', 'utf8'));

// Get system configs
const { data: configs } = await sc.systemConfigs.list(systemId);

const configA = configs.find(({ id }) => id === configAId);
const configB = configs.find(({ id }) => id === configBId);

console.log('🎭 Running experiment with configs:\n', {
  configA,
  configB,
});

if (metricIds.length > 0) {
  console.log('📊 Using metrics:', metricIds);
} else {
  console.log(
    `No metrics configured. Configure metrics at https://app.scorecard.io/projects/${projectId}/metrics and add metric IDs to eval-params.json to enable automated scoring.`,
  );
}

// Create an experiment
const runA = await runAndEvaluate(sc, {
  projectId,
  testsetId,
  metricIds,
  system: async (inputs) => {
    return await runJokeBot(inputs, configA.config);
  },
  systemConfigId: configA.id,
});

const runB = await runAndEvaluate(sc, {
  projectId,
  testsetId,
  metricIds,
  system: async (inputs) => {
    return await runJokeBot(inputs, configB.config);
  },
  systemConfigId: configB.id,
});

console.log(`
  ✅ Done! View your experiment:
  Config A: https://app.scorecard.io/projects/${projectId}/runs/${runA.id}
  Config B: https://app.scorecard.io/projects/${projectId}/runs/${runB.id}
  
  Try it locally:
  node system.js "pizza"
  `);
