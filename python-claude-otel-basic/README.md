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

This example demonstrates **decorator-based instrumentation** of Claude API calls using OpenTelemetry:

1. **Set up OpenTelemetry SDK** - Configure TracerProvider with OTLP exporter
2. **Create reusable decorators** - `@traced_workflow` and `@traced_gen_ai`
3. **Decorate functions** - Simply add decorators to instrument any function
4. **Add Gen AI attributes** - Automatically capture semantic conventions
5. **Export traces** - Send to Scorecard via OTLP

### Decorator Pattern

```python
# Workflow-level tracing
@traced_workflow("my-workflow")
def my_workflow():
    # Your workflow logic
    pass

# Gen AI operation tracing
@traced_gen_ai("chat")
def call_claude(prompt: str):
    # Get current span to add custom attributes
    span = trace.get_current_span()
    span.set_attribute("gen_ai.request.model", "claude-3-5-sonnet")
    # Make API call
    pass
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

## Benefits of Decorator-Based Instrumentation

✅ **Clean code** - No nested context managers, just simple decorators  
✅ **Reusable** - Define once, use everywhere  
✅ **Composable** - Stack multiple decorators for different concerns  
✅ **Full control** over span hierarchy and attributes  
✅ **Standardized** Gen AI semantic conventions  
✅ **Automatic error handling** - Decorators capture exceptions automatically  
✅ **Performance metrics** - Duration tracking built into decorators  

### Decorator Features

The example includes two decorators:

1. **`@traced_workflow(name)`** - Creates a workflow-level span
   - Automatically tracks success/failure
   - Captures exceptions with full context
   - Adds workflow metadata

2. **`@traced_gen_ai(operation)`** - Creates a Gen AI operation span
   - Follows Gen AI semantic conventions
   - Tracks timing automatically
   - Handles errors gracefully
   - Allows custom attributes via `trace.get_current_span()`

## Resources

- [OpenTelemetry Gen AI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Anthropic SDK Documentation](https://docs.anthropic.com/)
- [OpenTelemetry Python SDK](https://opentelemetry.io/docs/instrumentation/python/)
