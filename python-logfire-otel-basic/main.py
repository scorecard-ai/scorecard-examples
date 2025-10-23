"""
Example: Logfire + PydanticAI + Scorecard

This example shows how to use Logfire and PydanticAI together while sending
OpenTelemetry traces to Scorecard for evaluation.

PydanticAI provides:
- Type-safe agent framework with structured outputs
- Automatic Logfire integration (no manual instrumentation needed!)
- Built-in validation with Pydantic models
- Clean, ergonomic API for building AI agents

Logfire provides:
- Automatic instrumentation for PydanticAI
- Beautiful structured logging and span management
- Rich telemetry capture (tokens, cost, latency)
"""

import os
import logfire
from pydantic_ai import Agent

# Configuration
SCORECARD_API_KEY = "<YOUR_SCORECARD_API_KEY>"
OPENAI_API_KEY = "<YOUR_OPENAI_API_KEY>"
PROJECT_ID = "<YOUR_PROJECT_ID>"

# Configure environment variables
os.environ['OPENAI_API_KEY'] = OPENAI_API_KEY  # PydanticAI requires this
os.environ['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'https://tracing.scorecard.io/otel'
os.environ['OTEL_EXPORTER_OTLP_HEADERS'] = f'Authorization=Bearer {SCORECARD_API_KEY}'

# Initialize Logfire with Scorecard-specific configuration
logfire.configure(
    service_name="cat-facts",
    # Set to False to only send to Scorecard (not Logfire's backend)
    # Set to True if you want to send to both Scorecard and Logfire
    send_to_logfire=False,
)

print("[Logfire] Initialized with Scorecard OTLP endpoint")


# Create a PydanticAI agent
# PydanticAI automatically integrates with Logfire - no manual instrumentation needed!
agent = Agent(
    'openai:gpt-4o-mini',
    system_prompt='You are a cat expert. Provide interesting, accurate, and surprising facts about cats.',
)


async def run_workflow(prompt):
    """
    Run the workflow with PydanticAI and Logfire instrumentation.
    
    PydanticAI automatically:
    - Integrates with Logfire (captures all LLM calls)
    - Validates structured outputs with Pydantic
    - Handles retries and errors gracefully
    
    Logfire automatically:
    - Creates beautiful spans with structured data
    - Captures full request/response details
    - Tracks tokens, cost, and latency
    """
    with logfire.span(
        "generate-cat-facts",
        # Add Scorecard attributes
        **{
            "scorecard.projectId": PROJECT_ID,
            # GenAI semantic conventions
            "gen_ai.system": "openai",
            "gen_ai.request.model": "gpt-4o-mini",
            "gen_ai.operation.name": "chat",
        }
    ) as span:
        # Log the prompt with structured data
        logfire.info("Processing prompt", prompt=prompt)
        
        # Add the prompt as a GenAI attribute
        span.set_attribute("gen_ai.prompt", prompt)
        
        # Run the agent - PydanticAI automatically creates spans!
        # No manual instrumentation needed!
        result = await agent.run(prompt)
        
        # Get the response text
        cat_fact = result.output
        
        # Add the completion as a GenAI attribute
        span.set_attribute("gen_ai.completion", cat_fact)
        
        # Log token usage if available
        try:
            if hasattr(result, 'usage') and callable(result.usage):
                usage = result.usage()
                if usage:
                    span.set_attribute("gen_ai.usage.input_tokens", usage.request_tokens)
                    span.set_attribute("gen_ai.usage.output_tokens", usage.response_tokens)
                    span.set_attribute("gen_ai.usage.total_tokens", usage.total_tokens)
        except Exception:
            pass  # Usage tracking is optional
        
        # Log the completion
        logfire.info("Generated cat fact", fact=cat_fact)
        
        return cat_fact


async def main():
    """Main function to run the workflow"""
    # Run the workflow with a hardcoded prompt
    prompt = "Tell me an interesting fact about cats"
    print(f"Running workflow with prompt: {prompt}")
    
    try:
        cat_fact = await run_workflow(prompt)
        print(f"\n✨ Cat Fact: {cat_fact}\n")
    except Exception as e:
        # Logfire automatically captures exceptions in spans!
        logfire.error("Workflow failed", error=str(e))
        print(f"Error: {e}\n")
    
    # Force flush to ensure all traces are sent
    print("[Logfire] Flushing traces to Scorecard...")
    logfire.force_flush()
    print("[Logfire] All traces sent. Check Scorecard for traces!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
