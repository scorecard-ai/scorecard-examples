/**
 * Dog Facts Multi-Step Workflow with OpenTelemetry
 * 
 * This example demonstrates:
 * - Fetching testcases from a Scorecard testset
 * - Creating one trace per testcase with multiple nested spans
 * - Tracking gen_ai.prompt and gen_ai.completion for each LLM call
 * - Linking traces to testcases via scorecard.testcaseId
 * 
 * Workflow steps:
 * 1. Generate Dog Fact - Generate a basic fact about dogs
 * 2. Enhance Dog Fact - Make the fact more engaging with additional details
 */

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import OpenAI from "openai";
import Scorecard from "scorecard-ai";

// Configuration
const SCORECARD_API_KEY = "<YOUR_SCORECARD_API_KEY> ";
const OPENAI_API_KEY = "<YOUR_OPENAI_API_KEY>";
const PROJECT_ID = "<YOUR_PROJECT_ID>";
const TESTSET_ID = "<YOUR_TESTSET_ID>"; // https://app.scorecard.io/projects/<YOUR_PROJECT_ID>/testsets/<YOUR_TESTSET_ID>

// Set up OpenTelemetry with Scorecard
const exporter = new OTLPTraceExporter({
  url: "https://tracing.scorecard.io/otel/v1/traces",
  headers: {
    Authorization: `Bearer ${SCORECARD_API_KEY}`
  },
});

const tracerProvider = new NodeTracerProvider({
  resource: Resource.default().merge(
    new Resource({
      [ATTR_SERVICE_NAME]: "dog-facts",
      "scorecard.project_id": PROJECT_ID,
    })
  ),
});

tracerProvider.addSpanProcessor(new BatchSpanProcessor(exporter));
tracerProvider.register();

const tracer = trace.getTracer("dog-facts", "1.0.0");

console.log("[Tracer] OpenTelemetry initialized with Scorecard");

// Initialize clients
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const scorecard = new Scorecard({ apiKey: SCORECARD_API_KEY });

async function generateDogFact(prompt) {
  return tracer.startActiveSpan("dog_fact_workflow.generate", async (span) => {
    try {
      span.setAttribute("gen_ai.system", "openai");
      span.setAttribute("gen_ai.request.model", "gpt-4o-mini");
      span.setAttribute("gen_ai.operation.name", "chat");
      span.setAttribute("gen_ai.prompt", prompt);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });
      
      const result = completion.choices[0].message.content;
      span.setAttribute("gen_ai.completion", result);
      span.setAttribute("fact.length", result.length);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

async function enhanceDogFact(originalFact) {
  return tracer.startActiveSpan("dog_fact_workflow.enhance", async (span) => {
    try {
      const enhancementPrompt = `Take this dog fact and make it more engaging by adding an interesting detail or context. Keep it concise.

Original fact: "${originalFact}"

Enhanced version:`;
      
      span.setAttribute("gen_ai.system", "openai");
      span.setAttribute("gen_ai.request.model", "gpt-4o-mini");
      span.setAttribute("gen_ai.operation.name", "chat");
      span.setAttribute("gen_ai.prompt", enhancementPrompt);
      span.setAttribute("original_fact", originalFact);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: enhancementPrompt }],
      });
      
      const result = completion.choices[0].message.content;
      span.setAttribute("gen_ai.completion", result);
      span.setAttribute("enhanced_fact.length", result.length);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

async function runWorkflow(prompt, testcaseId) {
  return tracer.startActiveSpan("dog_fact_workflow", {
    attributes: {
      "scorecard.projectId": PROJECT_ID,
      "scorecard.testcaseId": testcaseId,
      "workflow.type": "dog-facts-generation",
    }
  }, async (span) => {
    try {
      console.log(`  [Step 1] Generating dog fact...`);
      const fact = await generateDogFact(prompt);
      
      console.log(`  [Step 2] Enhancing dog fact...`);
      const enhancedFact = await enhanceDogFact(fact);
      
      span.setAttribute("workflow.status", "completed");
      span.setAttribute("workflow.final_response", enhancedFact);
      span.setStatus({ code: SpanStatusCode.OK });
      
      return enhancedFact;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
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

// Ensure traces are flushed before exiting
await tracerProvider.forceFlush();
console.log("[Tracer] All traces sent. Check Scorecard for traces!");
