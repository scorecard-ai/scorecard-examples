# Python Logfire + PydanticAI + OpenTelemetry Basic Example

This example demonstrates how to use **Logfire** and **PydanticAI** together while sending OpenTelemetry traces to Scorecard for evaluation. It shows a simple AI agent with automatic instrumentation and structured outputs.

## Why Logfire + PydanticAI?

[PydanticAI](https://ai.pydantic.dev) is an agent framework by the Pydantic team that provides:

- 🎯 **Type-safe agents** with structured outputs using Pydantic models
- ✅ **Built-in validation** - ensures LLM responses match your schema
- 🔄 **Automatic retries** and error handling
- 🌟 **Native Logfire integration** - zero instrumentation code needed!
- 🧩 **Model-agnostic** - works with OpenAI, Anthropic, Google, and more

[Logfire](https://logfire.pydantic.dev) is an observability platform built by the Pydantic team that provides:

- 🎯 **Automatic instrumentation** for PydanticAI, OpenAI, Anthropic, FastAPI, and 30+ libraries
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

### 2. PydanticAI Agent with Structured Outputs

Define a Pydantic model for structured responses:

```python
class CatFact(BaseModel):
    fact: str
    category: str
    is_surprising: bool

agent = Agent(
    'openai:gpt-4o-mini',
    result_type=CatFact,
    system_prompt='You are a cat expert.'
)
```

PydanticAI automatically:
- Validates LLM outputs against your schema
- Retries on validation failures
- Integrates with Logfire (no manual instrumentation!)

This captures:
- Full request and response messages
- Model name and parameters
- Token usage (prompt, completion, total)
- Latency metrics
- Cost estimation
- Structured output validation
- Error details and retries

### 3. Running the Agent

Simply call the agent - PydanticAI + Logfire handle everything:

```python
async def run_workflow(prompt):
    with logfire.span("generate-cat-facts", **{"scorecard.projectId": PROJECT_ID}):
        logfire.info("Processing prompt", prompt=prompt)
        
        # PydanticAI automatically creates spans and validates output
        result = await agent.run(prompt)
        cat_fact = result.data  # Validated CatFact model
        
        logfire.info("Generated cat fact", fact=cat_fact.fact)
        return cat_fact
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

| Feature | Raw OpenTelemetry | Logfire + PydanticAI |
|---------|------------------|---------------------|
| Setup complexity | ~30 lines | ~5 lines |
| LLM instrumentation | Manual span creation | Automatic (zero code!) |
| Structured outputs | Manual parsing | Pydantic validation |
| Output validation | Not included | Built-in with retries |
| Structured logging | Manual attributes | Built-in with type hints |
| Exception handling | Manual `record_exception()` | Automatic capture |
| IDE support | Limited | Full type hints |
| Context management | Verbose | Clean `with` statements |

## Automatic Instrumentation Available

**PydanticAI** integrates automatically with Logfire - no manual instrumentation needed!

**Logfire** can also automatically instrument:

- **LLMs**: PydanticAI, OpenAI, Anthropic, Google GenAI, LangChain, LiteLLM, LlamaIndex, Mirascope
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

✨ Cat Fact: Cats have a specialized collarbone that allows them to always land on their feet when falling, a reflex known as the "righting reflex."
📁 Category: anatomy
🤔 Surprising: True

[Logfire] Flushing traces to Scorecard...
[Logfire] All traces sent. Check Scorecard for traces!
```

## Troubleshooting

- **No traces in Scorecard**: Verify your Scorecard API key and project ID are correct
- **OpenAI errors**: Check your OpenAI API key is valid and has sufficient credits
- **Import errors**: Ensure you've installed all dependencies: `pip install -r requirements.txt`

## Learn More

- [PydanticAI Documentation](https://ai.pydantic.dev)
- [Logfire Documentation](https://logfire.pydantic.dev)
- [Logfire + PydanticAI Integration](https://logfire.pydantic.dev/docs/integrations/llms/pydantic-ai/)
- [Scorecard Documentation](https://docs.scorecard.io)
- [OpenTelemetry Python](https://opentelemetry.io/docs/languages/python/)

## Why This Approach?

Using PydanticAI + Logfire + Scorecard gives you the best of all worlds:
- **PydanticAI**: Type-safe agents, structured outputs, built-in validation
- **Logfire**: Beautiful DX, automatic instrumentation, structured logging
- **Scorecard**: Powerful evaluation, testing, and quality assurance for AI applications

The combination is significantly more ergonomic than raw OpenTelemetry while maintaining full compatibility and flexibility, plus you get validated structured outputs from your LLM calls!
