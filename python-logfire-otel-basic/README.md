# Python Logfire + OpenTelemetry Basic Example

This example demonstrates how to use **Logfire**'s excellent instrumentation and developer experience while sending OpenTelemetry traces to Scorecard for evaluation. It shows a simple OpenAI workflow with automatic instrumentation.

## Why Logfire?

[Logfire](https://logfire.pydantic.dev) is an observability platform built by the Pydantic team that provides:

- 🎯 **Automatic instrumentation** for OpenAI, Anthropic, FastAPI, Django, SQLAlchemy, and 30+ popular libraries
- 🎨 **Beautiful structured logging** with rich context and attributes
- 🔧 **Ergonomic API** with type hints and excellent IDE support
- 🚀 **Zero-boilerplate setup** compared to raw OpenTelemetry
- 🌐 **Full OpenTelemetry compatibility** - works with any OTLP backend

## Prerequisites

- Python 3.8 or higher
- A Scorecard account and API key
- An OpenAI API key
- A Scorecard project ID

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Before running the example, update the following variables in `main.py`:

```python
SCORECARD_API_KEY = "<YOUR_SCORECARD_API_KEY>"
OPENAI_API_KEY = "<YOUR_OPENAI_API_KEY>"
PROJECT_ID = "<YOUR_PROJECT_ID>"
```

You can find your project ID in the Scorecard UI.

## Running the Example

```bash
python main.py
```

## How It Works

### 1. Logfire Configuration

Logfire is configured to send traces to Scorecard's OTLP endpoint:

```python
os.environ['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'https://tracing.scorecard.io/otel'
os.environ['OTEL_EXPORTER_OTLP_HEADERS'] = f'Authorization=Bearer {SCORECARD_API_KEY}'

logfire.configure(
    service_name="cat-facts",
    send_to_logfire=False,  # Only send to Scorecard
    resource_attributes={
        "scorecard.project_id": PROJECT_ID,
    },
)
```

### 2. Automatic OpenAI Instrumentation

With one line, Logfire automatically instruments OpenAI:

```python
logfire.instrument_openai(openai_client)
```

This captures:
- Full request and response messages
- Model name and parameters
- Token usage (prompt, completion, total)
- Latency metrics
- Cost estimation
- Error details

### 3. Structured Spans

Create spans with structured attributes:

```python
with logfire.span(
    "generate-cat-facts",
    scorecard_project_id=PROJECT_ID,
) as span:
    # Your code here
    logfire.info("Processing prompt", prompt=prompt)
```

### 4. Automatic Exception Tracking

Exceptions are automatically captured with full context:

```python
try:
    result = run_workflow(prompt, testcase_id)
except Exception as e:
    logfire.error("Workflow failed", error=str(e))
```

## Key Differences from Raw OpenTelemetry

| Feature | Raw OpenTelemetry | Logfire |
|---------|------------------|---------|
| Setup complexity | ~30 lines | ~5 lines |
| OpenAI instrumentation | Manual span creation | Automatic with `instrument_openai()` |
| Structured logging | Manual attributes | Built-in with type hints |
| Exception handling | Manual `record_exception()` | Automatic capture |
| IDE support | Limited | Full type hints |
| Context management | Verbose | Clean `with` statements |

## Automatic Instrumentation Available

Logfire can automatically instrument:

- **LLMs**: OpenAI, Anthropic, Google GenAI, LangChain, LiteLLM, LlamaIndex, Mirascope
- **Web Frameworks**: FastAPI, Django, Flask, Starlette, AIOHTTP
- **Databases**: SQLAlchemy, Psycopg, AsyncPG, PyMongo, Redis
- **HTTP Clients**: HTTPX, Requests, AIOHTTP
- **And many more!**

See the [Logfire integrations docs](https://logfire.pydantic.dev/docs/integrations/) for the full list.

## Sending to Both Logfire and Scorecard

If you want to send traces to both Logfire's platform AND Scorecard, simply set:

```python
logfire.configure(
    service_name="cat-facts",
    send_to_logfire=True,  # Changed from False
    resource_attributes={
        "scorecard.project_id": PROJECT_ID,
    },
)
```

This gives you:
- Scorecard's evaluation and testing features
- Logfire's beautiful UI and real-time monitoring

## What to Expect

After running the example, you should see:
1. Console output showing the prompt and response
2. Rich traces in your Scorecard project dashboard
3. Full OpenAI request/response details captured automatically

## Example Output

```
[Logfire] Initialized with Scorecard OTLP endpoint
Running workflow with prompt: Tell me an interesting fact about cats
Result: cats have an incredible sense of smell that is 10,000 to 100,000 times more sensitive than humans!

[Logfire] Flushing traces to Scorecard...
[Logfire] All traces sent. Check Scorecard for traces!
```

## Troubleshooting

- **No traces in Scorecard**: Verify your Scorecard API key and project ID are correct
- **OpenAI errors**: Check your OpenAI API key is valid and has sufficient credits
- **Import errors**: Ensure you've installed all dependencies: `pip install -r requirements.txt`

## Learn More

- [Logfire Documentation](https://logfire.pydantic.dev)
- [Logfire Integrations](https://logfire.pydantic.dev/docs/integrations/)
- [Scorecard Documentation](https://docs.scorecard.io)
- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)

## Why This Approach?

Using Logfire with Scorecard gives you the best of both worlds:
- **Logfire**: Beautiful DX, automatic instrumentation, structured logging
- **Scorecard**: Powerful evaluation, testing, and quality assurance for AI applications

The combination is significantly more ergonomic than raw OpenTelemetry while maintaining full compatibility and flexibility!
