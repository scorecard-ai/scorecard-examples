"""
Example: Claude Agent SDK with Multi-Step Workflow + OpenTelemetry

Demonstrates building a research agent with multiple steps using the Claude Agent SDK
and OpenTelemetry Gen AI semantic conventions for observability.
"""

import asyncio
from claude_agent_sdk import Agent, AgentOptions
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

# Setup OpenTelemetry
resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "research-agent",
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


@tracer.start_as_current_span("agent.step")
async def run_agent_step(agent: Agent, step_name: str, prompt: str) -> str:
    """Run a single agent step with tracing."""
    span = trace.get_current_span()
    span.set_attributes({
        "agent.step.name": step_name,
        "agent.step.prompt_length": len(prompt),
    })
    
    print(f"\n📍 Step: {step_name}")
    
    # Run the agent for this step
    result = await agent.run(prompt)
    
    # Extract text from result
    if hasattr(result, 'messages') and result.messages:
        output = result.messages[-1].content[0].text if result.messages[-1].content else ""
    else:
        output = str(result)
    
    span.set_attributes({
        "agent.step.output_length": len(output),
        "agent.step.success": True,
    })
    
    print(f"✓ Completed: {step_name}")
    return output


@tracer.start_as_current_span("research-workflow")
async def research_cats_workflow():
    """
    Multi-step research workflow:
    1. Gather initial facts
    2. Identify interesting angles
    3. Deep dive on one angle
    4. Synthesize findings
    """
    span = trace.get_current_span()
    span.set_attributes({
        "workflow.name": "research-cats",
        "workflow.steps": 4,
    })
    
    # Initialize agent with tools
    agent = Agent(
        api_key="<YOUR_ANTHROPIC_API_KEY>",
        options=AgentOptions(
            model="claude-3-5-sonnet-20241022",
            system_prompt="""You are a research assistant specializing in animals.
            Your goal is to provide accurate, interesting, and well-researched information.
            Break down your research into clear steps.""",
            # Allow the agent to use tools like web search
            allowed_tools=["read", "write"],  # Basic tools for demonstration
        )
    )
    
    try:
        # Step 1: Gather initial facts
        facts = await run_agent_step(
            agent,
            "gather_facts",
            "List 5 interesting facts about cats. Focus on lesser-known information."
        )
        
        # Step 2: Identify interesting angles
        angles = await run_agent_step(
            agent,
            "identify_angles",
            f"Based on these facts:\n{facts}\n\nIdentify the most surprising or counterintuitive fact."
        )
        
        # Step 3: Deep dive
        deep_dive = await run_agent_step(
            agent,
            "deep_dive",
            f"Research this angle in depth:\n{angles}\n\nProvide scientific explanations and examples."
        )
        
        # Step 4: Synthesize
        synthesis = await run_agent_step(
            agent,
            "synthesize",
            f"Create a compelling summary of our research:\n{deep_dive}\n\nMake it engaging for a general audience."
        )
        
        span.set_attribute("workflow.success", True)
        return synthesis
        
    except Exception as e:
        span.set_attribute("workflow.success", False)
        span.record_exception(e)
        raise


async def main():
    """Main entry point."""
    print("🔬 Starting cat research workflow with Claude Agent SDK...")
    
    result = await research_cats_workflow()
    
    print(f"\n{'='*60}")
    print("📊 FINAL RESEARCH SUMMARY")
    print(f"{'='*60}")
    print(f"\n{result}\n")
    
    # Flush traces
    trace.get_tracer_provider().force_flush()
    print("✓ Traces sent to Scorecard")


if __name__ == "__main__":
    asyncio.run(main())
