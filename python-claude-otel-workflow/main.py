"""
Example: Multi-Step Claude Agent with OpenTelemetry Gen AI Semantics

Demonstrates instrumenting a Claude agent workflow with Gen AI semantic conventions
for observability in Scorecard.
"""

import asyncio
import os
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions, AssistantMessage, TextBlock
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

# Configuration
SCORECARD_API_KEY = os.getenv("SCORECARD_API_KEY", "<YOUR_SCORECARD_API_KEY>")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "<YOUR_ANTHROPIC_API_KEY>")
OTLP_ENDPOINT = "https://tracing.scorecard.io/otel/v1/traces"
MODEL = "claude-sonnet-4-5"

# Setup OpenTelemetry with Scorecard
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "claude-agent",
    ResourceAttributes.SERVICE_VERSION: "1.0.0",
})

trace_provider = TracerProvider(resource=resource)
trace_provider.add_span_processor(BatchSpanProcessor(
    OTLPSpanExporter(
        endpoint=OTLP_ENDPOINT,
        headers={"Authorization": f"Bearer {SCORECARD_API_KEY}"}
    )
))
trace.set_tracer_provider(trace_provider)

tracer = trace.get_tracer(__name__)


@tracer.start_as_current_span("agent.step")
async def run_agent_step(client: ClaudeSDKClient, prompt: str) -> str:
    """Execute a single agent step with Gen AI semantic conventions."""
    span = trace.get_current_span()
    
    # Set Gen AI attributes for the request
    span.set_attributes({
        "gen_ai.system": "anthropic",
        "gen_ai.request.model": MODEL,
        "gen_ai.operation.name": "chat",
    })
    span.set_attribute("gen_ai.prompt", prompt)
    
    # Call Claude
    await client.query(prompt)
    
    # Collect response and usage metrics
    output_parts = []
    input_tokens = 0
    output_tokens = 0
    
    async for message in client.receive_response():
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if isinstance(block, TextBlock):
                    output_parts.append(block.text)
            
            if hasattr(message, 'usage'):
                input_tokens += getattr(message.usage, 'input_tokens', 0)
                output_tokens += getattr(message.usage, 'output_tokens', 0)
    
    output = "\n".join(output_parts)
    
    # Set Gen AI attributes for the response
    span.set_attribute("gen_ai.completion", output)
    span.set_attributes({
        "gen_ai.usage.input_tokens": input_tokens,
        "gen_ai.usage.output_tokens": output_tokens,
    })
    
    return output


@tracer.start_as_current_span("agent-workflow")
async def research_workflow():
    """Multi-step agent workflow with Gen AI tracing."""
    
    # Configure Claude agent
    options = ClaudeAgentOptions(
        model=MODEL,
        system_prompt="You are a helpful research assistant.",
        allowed_tools=[],
        max_turns=1,
    )
    
    async with ClaudeSDKClient(options=options) as client:
        # Step 1: Gather facts
        facts = await run_agent_step(
            client,
            "List 5 interesting facts about cats."
        )
        
        # Step 2: Analyze
        analysis = await run_agent_step(
            client,
            f"Based on these facts:\n{facts}\n\nWhat is the most surprising fact and why?"
        )
        
        # Step 3: Summarize
        summary = await run_agent_step(
            client,
            f"Create a brief summary:\n{analysis}"
        )
        
        return summary


async def main():
    """Run the agent workflow and send traces to Scorecard."""
    result = await research_workflow()
    
    print(f"\nResult:\n{result}\n")
    
    # Flush traces to Scorecard
    trace.get_tracer_provider().force_flush()
    print("✓ Traces sent to Scorecard")


if __name__ == "__main__":
    asyncio.run(main())
