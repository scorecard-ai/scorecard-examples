# OpenLLMetry Scorecard Tracing Example

This example demonstrates how to use [OpenLLMetry](https://github.com/traceloop/openllmetry-js) (via `@traceloop/node-server-sdk`) to automatically instrument and trace LLM calls for Scorecard monitoring.

## What is OpenLLMetry?

OpenLLMetry is an open-source observability framework that automatically instruments LLM applications using OpenTelemetry standards. It provides:

- **Automatic instrumentation** of popular LLM libraries (OpenAI, Anthropic, etc.)
- **Structured tracing** with workflows and tasks
- **Seamless integration** with observability platforms like Scorecard
- **Zero-code instrumentation** for basic use cases

## Quick Start

### 1. Install Dependencies

```bash
npm install @traceloop/node-server-sdk openai dotenv
```

### 2. Set Up Environment Variables

Create a `.env` file with the following variables:

```bash
# OpenAI Configuration
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>

# OpenLLMetry Configuration for Scorecard
TRACELOOP_BASE_URL=https://tracing.scorecard.io/otel/v1/traces
TRACELOOP_HEADERS="Authorization=Bearer <YOUR_SCORECARD_KEY>"
```

### 3. Initialize and Configure Tracing

The example in `index.js` shows a complete setup:

```javascript
import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI();

// Initialize OpenLLMetry with Scorecard configuration
traceloop.initialize({ 
  disableBatch: true  // Ensures immediate trace sending
  instrumentModules: { openAI: OpenAI },
});
```

### 4. Structure Your Code

```javascript
async function simpleWorkflow() {
  return await traceloop.withWorkflow({ name: "simple_chat" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Tell me a joke" }],
    });
    return completion.choices[0].message.content;
  });
}

simpleWorkflow();
```

### 5. Run Your Application

```bash
node index.js
```

### Getting Your Scorecard Credentials

1. Visit [Scorecard](https://app.getscorecard.ai)
2. Navigate to your settings page
3. Find your **Scorecard Key**
4. Use the tracing endpoint: `https://tracing.scorecard.io/otel/v1/traces`

## Viewing Traces in Scorecard

After running your application:

1. **Visit Scorecard**: Go to [app.getscorecard.ai](https://app.getscorecard.ai)
2. **Navigate to Traces**: Go to your project → Traces section

### What You'll See

- **Workflow spans**: High-level operations (`joke_generator`)
- **Task spans**: Individual operations (`joke_creation`, `author_generation`)  
- **LLM spans**: Automatic OpenAI API call instrumentation
- **Timing data**: Duration of each operation
- **Token usage**: Input/output tokens for LLM calls
- **Model information**: Which models were used

## Learn More

- [OpenLLMetry Documentation](https://github.com/traceloop/openllmetry-js)
- [Scorecard Documentation](https://docs.getscorecard.ai/)
- [OpenTelemetry Standards](https://opentelemetry.io/)
