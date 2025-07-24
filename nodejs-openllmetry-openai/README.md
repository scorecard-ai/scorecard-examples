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
OPENAI_API_KEY=your_openai_api_key_here

# OpenLLMetry Configuration for Scorecard
TRACELOOP_BASE_URL=https://telemetry.getscorecard.ai:4318
TRACELOOP_HEADERS="Authorization=Bearer <YOUR_SCORECARD_TELEMETRY_KEY>"
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

### 4. Structure Your Code with Workflows and Tasks

```javascript
// Create individual tasks for different operations
async function createJoke() {
  return await traceloop.withTask({ name: "joke_creation" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Tell me a joke" }],
    });
    return completion.choices[0].message.content;
  });
}

async function generateAuthor(joke) {
  return await traceloop.withTask({ name: "author_generation" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: `add a author to the joke:\n\n${joke}` },
      ],
    });

    return completion.choices[0].message.content;
  });
}

// Group related tasks into workflows
async function joke_workflow() {
  return await traceloop.withWorkflow({ name: "joke_generator" }, async () => {
    const joke = await createJoke();
    await generateAuthor(joke);
  });
}
```

### 5. Run Your Application

```bash
node index.js
```

### Getting Your Scorecard Credentials

1. Visit [Scorecard Dashboard](https://app.getscorecard.ai)
2. Navigate to your project's traces section
3. Find your **Telemetry Key** in "Learn how to setup tracing" link there
4. Use the telemetry endpoint: `https://telemetry.getscorecard.ai:4318`

## Code Structure Explanation

### Automatic Instrumentation

OpenLLMetry automatically instruments your OpenAI calls without requiring code changes:

```javascript
// This call is automatically traced
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Tell me a joke" }],
});
```

### Manual Task Creation

Use `traceloop.withTask()` to create custom spans for specific operations:

```javascript
async function createJoke() {
  return await traceloop.withTask({ name: "joke_creation" }, async () => {
    // Your code here - all operations inside will be part of this task
    const completion = await openai.chat.completions.create({...});
    return completion.choices[0].message.content;
  });
}
```

### Workflow Organization

Use `traceloop.withWorkflow()` to group related tasks into logical workflows:

```javascript
async function joke_workflow() {
  return await traceloop.withWorkflow({ name: "joke_generator" }, async () => {
    const joke = await createJoke();        // Task 1
    const author = await generateAuthor(joke); // Task 2
    return { joke, author };
  });
}
```

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
