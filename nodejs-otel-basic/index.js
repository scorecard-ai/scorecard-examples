import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import OpenAI from "openai";
import Scorecard from "scorecard-ai";

// Configuration
const SCORECARD_API_KEY = "<YOUR_SCORECARD_API_KEY>";
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

async function runWorkflow(prompt, testcaseId) {
  return tracer.startActiveSpan("generate-dog-facts", async (span) => {
    try {
      span.setAttribute("scorecard.projectId", PROJECT_ID);
      span.setAttribute("scorecard.testcaseId", testcaseId);
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
