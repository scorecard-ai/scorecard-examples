# Scorecard Tracing Example: Node.js Express with OpenAI

A minimal Express example showing how to trace LLM calls using OpenTelemetry to send traces to Scorecard. Uses OpenTelemetry's semantic conventions for GenAI.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/scorecard-ai/scorecard-examples.git
cd scorecard-examples/nodejs-express

# Install dependencies
npm install

# Start the server
npm start

# In a new terminal, test the endpoint
curl -X POST http://localhost:4080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me about space"}'
```

## Viewing Results

1. Visit [Scorecard](https://app.getscorecard.ai)
2. Navigate to `/projects/[project-id]/traces` (replace with your project id)
3. Look for traces from "scorecard-nodejs-express-otel-openai" to see your LLM call

## Requirements

- Node.js 16+
- npm
