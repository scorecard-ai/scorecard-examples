// Import required dependencies
import express from 'express';
// OpenTelemetry imports for tracing and monitoring
import { trace } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
// OpenAI SDK for making API calls
import OpenAI from 'openai';

// Configuration constants
// Scorecard telemetry endpoint for sending trace data
const SCORECARD_TELEMETRY_URL = 'https://telemetry.getscorecard.ai:4318/v1/traces';
const SCORECARD_TELEMETRY_KEY = 'replace-me'; // replace with your Scorecard telemetry key
const OPENAI_API_KEY = 'replace-me'; // replace with your OpenAI API key

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Set up OpenTelemetry tracing
// Create a tracer provider with service information and Scorecard project ID
const provider = new NodeTracerProvider({
    resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'scorecard-nodejs-express-otel-openai',
        [SemanticResourceAttributes.SERVICE_VERSION]: '0.0.1',
        'scorecard.project_id': 'replace-me' // replace with your Scorecard project ID
    })
});

// Configure the OpenTelemetry exporter to send traces to Scorecard
const exporter = new OTLPTraceExporter({
    url: SCORECARD_TELEMETRY_URL,
    headers: {
        'Authorization': `Bearer ${SCORECARD_TELEMETRY_KEY}`
    }
});

// Set up batch processing of spans and register the provider
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

// Register Express instrumentation for automatic tracing of HTTP requests
registerInstrumentations({
    instrumentations: [
        new ExpressInstrumentation()
    ]
});

// Get a tracer instance for our application
const tracer = trace.getTracer('gen-ai');

// Initialize Express application
const app = express();
app.use(express.json());

/**
 * Make an LLM API call to OpenAI with OpenTelemetry semantic conventions for GenAI.
 * @param {string} prompt - The input prompt for the AI
 * @returns {Promise<string>} The generated response
 */
async function generate(prompt) {
    // Start a new span for tracking the LLM call
    const span = tracer.startSpan('llm_call');
    
    try {
        // Add attributes to the span for better observability
        span.setAttribute('openinference.span.kind', 'LLM');
        span.setAttribute('gen_ai.request.model', 'gpt-3.5-turbo');
        span.setAttribute('gen_ai.request.max_tokens', 1024);
        span.setAttribute('gen_ai.prompt.0.content', prompt);
        
        // Make the API call to OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024
        });

        // Extract response and token usage information
        const response = completion.choices[0].message.content;
        const promptTokens = completion.usage.prompt_tokens;
        const responseTokens = completion.usage.completion_tokens;
        const totalTokens = completion.usage.total_tokens;

        // Record completion details and token usage in the span
        span.setAttribute('gen_ai.completion.0.content', response);
        span.setAttribute('llm.token_count.prompt', promptTokens);
        span.setAttribute('llm.token_count.completion', responseTokens);
        span.setAttribute('llm.token_count.total', totalTokens);
        
        return response;
    } finally {
        // Ensure the span is ended even if an error occurs
        span.end();
    }
}

// Define API endpoint for text generation
app.post('/generate', async (req, res) => {
    const prompt = req.body.prompt || 'Tell me something interesting';
    const response = await generate(prompt);
    res.json({ prompt, response });
});

// Start the server
app.listen(4080, () => {
    console.log(`🚀 Scorecard example running at http://localhost:4080`);
});
