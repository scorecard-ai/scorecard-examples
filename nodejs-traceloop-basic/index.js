import * as traceloop from "@traceloop/node-server-sdk";
import { trace } from "@opentelemetry/api";
import OpenAI from "openai";
import Scorecard from "scorecard-ai";
import dotenv from "dotenv";

dotenv.config();

// Configuration
const SCORECARD_API_KEY = process.env.SCORECARD_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROJECT_ID = process.env.PROJECT_ID;
const TESTSET_ID = process.env.TESTSET_ID;

// Initialize traceloop with Scorecard
traceloop.initialize({
  appName: "dog-facts",
  instrumentModules: { openAI: OpenAI },
  disableBatch: true,
  traceContent: true,
  resourceAttributes: {
    "scorecard.project_id": PROJECT_ID,
  },
});

console.log("[Tracer] Traceloop initialized with Scorecard");

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const scorecard = new Scorecard({ apiKey: SCORECARD_API_KEY });

async function runWorkflow(prompt, testcaseId) {
  return traceloop.withWorkflow({ name: "generate-dog-facts" }, async () => {
    // Add custom attributes to the active span
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute("scorecard.projectId", PROJECT_ID);
      span.setAttribute("scorecard.testcaseId", testcaseId);
    }

    // OpenAI call will be automatically instrumented by traceloop
    // It will capture gen_ai.* attributes automatically
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0].message.content;
  });
}

// Fetch testset and run workflow for each testcase
console.log(`Fetching testset ${TESTSET_ID}...`);

for await (const testcase of scorecard.testcases.list(TESTSET_ID)) {
  const prompt = testcase.jsonData.prompt || "Tell me a fact about dogs";
  console.log(`[Testcase ${testcase.id}] Prompt: ${prompt}`);

  const result = await runWorkflow(prompt, testcase.id);
  console.log(`[Testcase ${testcase.id}] Result: ${result}\n`);
}

// Traces are sent immediately with disableBatch: true
console.log("[Tracer] All traces sent. Check Scorecard for traces!");
