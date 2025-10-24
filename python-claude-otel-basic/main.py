"""
Example: Anthropic Claude with OpenTelemetry Gen AI Semantic Conventions

This example shows how to instrument Anthropic Claude API calls using decorators
with OpenTelemetry following the Gen AI semantic conventions.
"""

import os
import time
import functools
from typing import Callable, Any
from anthropic import Anthropic
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

# Configure OpenTelemetry
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "cat-facts",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
})

# Set up trace provider with OTLP exporter
trace_provider = TracerProvider(resource=resource)
otlp_exporter = OTLPSpanExporter(
    endpoint="https://tracing.scorecard.io/otel",
    headers={"Authorization": "Bearer <YOUR_SCORECARD_API_KEY>"}
)
trace_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
trace.set_tracer_provider(trace_provider)

# Get tracer
tracer = trace.get_tracer(__name__)

print("✓ OpenTelemetry configured with Gen AI semantic conventions")

# Initialize Anthropic client
client = Anthropic(api_key="<YOUR_ANTHROPIC_API_KEY>")


# Decorator for workflow spans
def traced_workflow(workflow_name: str):
    """Decorator to create a workflow span"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(workflow_name) as span:
                span.set_attribute("workflow.type", workflow_name)
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("workflow.success", True)
                    return result
                except Exception as e:
                    span.set_attribute("workflow.success", False)
                    span.set_attribute("error", True)
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator


# Decorator for Gen AI operations
def traced_gen_ai(operation_name: str = "chat"):
    """Decorator to create a Gen AI span with semantic conventions"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(
                f"gen_ai.{operation_name}",
                kind=trace.SpanKind.CLIENT
            ) as span:
                span.set_attribute("gen_ai.system", "anthropic")
                span.set_attribute("gen_ai.operation.name", operation_name)
                
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    duration = time.time() - start_time
                    span.set_attribute("duration_ms", duration * 1000)
                    return result
                except Exception as e:
                    span.set_attribute("error", True)
                    span.set_attribute("error.type", type(e).__name__)
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise
        return wrapper
    return decorator


@traced_gen_ai("chat")
def generate_cat_fact(prompt: str, model: str = "claude-3-5-sonnet-20241022") -> str:
    """
    Call Claude API - instrumented with @traced_gen_ai decorator.
    
    Follows OpenTelemetry Gen AI Semantic Conventions:
    https://opentelemetry.io/docs/specs/semconv/gen-ai/
    """
    # Get current span to add attributes
    span = trace.get_current_span()
    
    # Set request attributes
    span.set_attribute("gen_ai.request.model", model)
    span.set_attribute("gen_ai.request.max_tokens", 1024)
    span.set_attribute("gen_ai.request.temperature", 1.0)  # Claude default
    
    # Make the API call
    message = client.messages.create(
        model=model,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    
    # Set response attributes
    span.set_attribute("gen_ai.response.model", message.model)
    span.set_attribute("gen_ai.response.id", message.id)
    span.set_attribute("gen_ai.response.finish_reasons", [message.stop_reason])
    span.set_attribute("gen_ai.usage.input_tokens", message.usage.input_tokens)
    span.set_attribute("gen_ai.usage.output_tokens", message.usage.output_tokens)
    
    # Log usage info
    duration_ms = span.get_context().attributes.get("duration_ms", 0)
    print(f"Model: {message.model}")
    print(f"Tokens: {message.usage.input_tokens} in / {message.usage.output_tokens} out")
    
    return message.content[0].text


@traced_workflow("generate-cat-facts-workflow")
def main():
    """Main function to run the workflow - instrumented with @traced_workflow decorator"""
    prompt = "Tell me an interesting fact about cats"
    
    cat_fact = generate_cat_fact(prompt)
    print(f"\n✨ {cat_fact}")
    
    # Flush traces to ensure they're sent
    trace.get_tracer_provider().force_flush()
    print("\n✓ Traces sent to Scorecard via OTLP")


if __name__ == "__main__":
    main()
