# Python Claude with OpenTelemetry Gen AI Semantic Conventions

Manually instrument Anthropic Claude API calls with OpenTelemetry following the Gen AI semantic conventions.

## Prerequisites

- Python 3.8 or higher
- A Scorecard API key
- An Anthropic API key

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Update these values in `main.py`:

```python
otlp_exporter = OTLPSpanExporter(
    endpoint="https://tracing.scorecard.io/otel",
    headers={"Authorization": "Bearer <YOUR_SCORECARD_API_KEY>"}
)
client = Anthropic(api_key="<YOUR_ANTHROPIC_API_KEY>")
```

## Running the Example

```bash
python main.py
```

## How It Works

This example uses OpenTelemetry's **built-in decorator** for simple instrumentation:

1. **Setup** - Configure TracerProvider with OTLP exporter
2. **Decorate** - Use `@tracer.start_as_current_span("span-name")`
3. **Add attributes** - Use `span.set_attributes()` for Gen AI conventions
4. **Done** - Traces automatically export to Scorecard

### Simple Example

```python
@tracer.start_as_current_span("gen_ai.chat")
def call_claude(prompt: str):
    span = trace.get_current_span()
    span.set_attributes({
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": "claude-3-5-sonnet",
    })
    # Make API call
    return client.messages.create(...)
```

### Gen AI Semantic Conventions

Following the [OpenTelemetry Gen AI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/), this example captures:

#### Request Attributes
- `gen_ai.system` - The AI system (e.g., "anthropic")
- `gen_ai.request.model` - Model identifier
- `gen_ai.operation.name` - Operation type (e.g., "chat")
- `gen_ai.request.max_tokens` - Maximum tokens requested
- `gen_ai.request.temperature` - Temperature parameter

#### Response Attributes
- `gen_ai.response.model` - Actual model used
- `gen_ai.response.id` - Response identifier
- `gen_ai.response.finish_reasons` - Why generation stopped
- `gen_ai.usage.input_tokens` - Input tokens consumed
- `gen_ai.usage.output_tokens` - Output tokens generated

#### Error Handling
- `error` - Boolean flag for errors
- `error.type` - Exception type
- `error.message` - Error message
- Exception events with full stack trace

### Span Structure

```
generate-cat-facts-workflow (root span)
  └── gen_ai.chat (client span)
        ├── gen_ai.system: anthropic
        ├── gen_ai.request.model: claude-3-5-sonnet-20241022
        ├── gen_ai.usage.input_tokens: 15
        └── gen_ai.usage.output_tokens: 42
```

## Why This Approach?

✅ **Simple** - Uses OpenTelemetry's built-in `@tracer.start_as_current_span()`  
✅ **No custom decorators** - Just standard OpenTelemetry  
✅ **Automatic error handling** - Exceptions captured automatically  
✅ **Batch attributes** - Use `set_attributes()` instead of multiple `set_attribute()` calls  
✅ **Gen AI conventions** - Easy to follow semantic conventions

## Resources

- [OpenTelemetry Gen AI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Anthropic SDK Documentation](https://docs.anthropic.com/)
- [OpenTelemetry Python SDK](https://opentelemetry.io/docs/instrumentation/python/)
