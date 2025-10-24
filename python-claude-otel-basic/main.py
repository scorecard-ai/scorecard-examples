"""
Example: Anthropic Claude with OpenTelemetry Gen AI Semantic Conventions

Simple decorator-based instrumentation for Claude API calls.
"""

from anthropic import Anthropic
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

# Setup OpenTelemetry
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "cat-facts",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
})

trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(BatchSpanProcessor(
    OTLPSpanExporter(
        endpoint="https://tracing.scorecard.io/otel",
        headers={"Authorization": "Bearer <YOUR_SCORECARD_API_KEY>"}
    )
))
trace.set_tracer_provider(trace_provider)

tracer = trace.get_tracer(__name__)
client = Anthropic(api_key="<YOUR_ANTHROPIC_API_KEY>")


@tracer.start_as_current_span("gen_ai.chat")
def generate_cat_fact(prompt: str, model: str = "claude-3-5-sonnet-20241022") -> str:
    """Call Claude API with OpenTelemetry Gen AI semantic conventions."""
    span = trace.get_current_span()
    
    # Request attributes
    span.set_attributes({
        "gen_ai.system": "anthropic",
        "gen_ai.operation.name": "chat",
        "gen_ai.request.model": model,
        "gen_ai.request.max_tokens": 1024,
    })
    
    # Make API call
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    
    # Response attributes
    span.set_attributes({
        "gen_ai.response.model": message.model,
        "gen_ai.response.id": message.id,
        "gen_ai.usage.input_tokens": message.usage.input_tokens,
        "gen_ai.usage.output_tokens": message.usage.output_tokens,
    })
    
    print(f"✓ {message.usage.input_tokens} tokens in / {message.usage.output_tokens} tokens out")
    return message.content[0].text


@tracer.start_as_current_span("cat-facts-workflow")
def main():
    """Main workflow function."""
    result = generate_cat_fact("Tell me an interesting fact about cats")
    print(f"\n✨ {result}\n")
    
    trace.get_tracer_provider().force_flush()
    print("✓ Traces sent to Scorecard")


if __name__ == "__main__":
    main()
