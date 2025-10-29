"""
Example: Logfire + PydanticAI + Scorecard

This example shows how to use Logfire and PydanticAI together while sending
OpenTelemetry traces to Scorecard for evaluation.
"""

import os
import logfire
from pydantic_ai import Agent

# Configure environment variables
# 1. OTEL_EXPORTER_OTLP_ENDPOINT: Scorecard's OTLP endpoint, this is where the traces will be sent
# 2. OTEL_EXPORTER_OTLP_HEADERS: Scorecard's API key, this is used to authenticate
# 3. OPENAI_API_KEY: PydanticAI requires an OpenAI API key if using OpenAI models
# 4. OTEL_RESOURCE_ATTRIBUTES: Add scorecard.project_id for monitoring
os.environ['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'https://tracing.scorecard.io/otel'
os.environ['OTEL_EXPORTER_OTLP_HEADERS'] = f'Authorization=Bearer <YOUR_SCORECARD_API_KEY>'
os.environ['OPENAI_API_KEY'] = "<YOUR_OPENAI_API_KEY>"
os.environ['OTEL_RESOURCE_ATTRIBUTES'] = 'scorecard.project_id=<YOUR_SCORECARD_PROJECT_ID>'

# Initialize Logfire
logfire.configure(
    service_name="cat-facts",
    # Set to False to only send to Scorecard (not Logfire's backend)
    send_to_logfire=False,
)

# Instrument PydanticAI - this automatically adds GenAI semantic conventions!
# PydanticAI follows OpenTelemetry Semantic Conventions for GenAI (v1.37.0)
logfire.instrument_pydantic_ai()

# Create a PydanticAI agent
# PydanticAI automatically integrates with Logfire - no manual instrumentation needed!
agent = Agent(
    'openai:gpt-4o-mini',
    system_prompt='You are a cat expert. Provide interesting, accurate, and surprising facts about cats.',
)


async def run_workflow(prompt):
    """
    Run the workflow with PydanticAI and Logfire instrumentation.
    """
    # Instrument the agent workflow with a span (you will see this in Scorecard)
    with logfire.span("generate-cat-facts"):
        # Run the agent - PydanticAI + Logfire automatically capture everything
        result = await agent.run(prompt)
        return result.output


async def main():
    """Main function to run the workflow"""
    prompt = "Tell me an interesting fact about cats"
    
    try:
        cat_fact = await run_workflow(prompt)
        print(f"✨ {cat_fact}")
    except Exception as e:
        logfire.error("Workflow failed", error=str(e))
        print(f"Error: {e}")
    
    # Force flush to ensure all traces are sent to Scorecard
    logfire.force_flush()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
