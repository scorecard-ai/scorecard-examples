import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: `<YOUR_OPENAI_API_KEY>`
});

// Initialize OpenLLMetry with automatic instrumentation
traceloop.initialize({ 
  appName: "dog-facts",
  baseURL: "https://tracing.scorecard.io/otel",
  headers: {
    "Authorization": `Bearer <YOUR_SCORECARD_API_KEY>`
  },
  instrumentModules: { openAI: OpenAI },
  disableBatch: true,  // Ensures immediate trace sending
  traceContent: true,
});

async function simpleWorkflow() {
    return await traceloop.withWorkflow({ name: "generate-dog-facts" }, async () => {
        const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Tell me a fact about dogs" }],
        });
        return completion.choices[0].message.content;
    });
}
  
// Run the workflow - all LLM calls will be automatically traced
const result = await simpleWorkflow();
console.log(result);
console.log("Check Scorecard for traces!");
