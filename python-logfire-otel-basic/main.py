"""
Example: Logfire + OpenAI + Scorecard

This example shows how to use Logfire's excellent instrumentation and developer
experience while sending OpenTelemetry traces to Scorecard for evaluation.

Logfire provides:
- Automatic instrumentation for OpenAI and other popular libraries
- Beautiful structured logging and span management
- Type hints and IDE support
- Easy context management
"""

import os
import logfire
from openai import OpenAI

# Configuration
SCORECARD_API_KEY = "<YOUR_SCORECARD_API_KEY>"
OPENAI_API_KEY = "<YOUR_OPENAI_API_KEY>"
PROJECT_ID = "<YOUR_PROJECT_ID>"

# Configure Logfire to send traces to Scorecard
# This tells Logfire to export to Scorecard's OTLP endpoint
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

# Initialize OpenAI client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

# Logfire automatically instruments OpenAI!
# This captures all OpenAI API calls with rich telemetry
logfire.instrument_openai(openai_client)


def run_workflow(prompt):
    """
    Run the workflow with Logfire instrumentation.
    
    Logfire automatically:
    - Creates beautiful spans with structured data
    - Captures OpenAI API calls with full request/response details
    - Handles errors gracefully with exception tracking
    """
    with logfire.span(
        "generate-cat-facts",
        # Add custom attributes for Scorecard
        **{"scorecard.projectId": PROJECT_ID}
    ) as span:
        # Log the prompt with structured data
        logfire.info("Processing prompt", prompt=prompt)
        
        # OpenAI call is automatically instrumented!
        # Logfire captures: model, tokens, latency, cost, full messages
        completion = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        
        result = completion.choices[0].message.content
        
        # Log the completion
        logfire.info("Generated response", result=result)
        
        return result


# Run the workflow with a hardcoded prompt
prompt = "Tell me an interesting fact about cats"
print(f"Running workflow with prompt: {prompt}")

try:
    result = run_workflow(prompt)
    print(f"Result: {result}\n")
except Exception as e:
    # Logfire automatically captures exceptions in spans!
    logfire.error("Workflow failed", error=str(e))
    print(f"Error: {e}\n")

# Force flush to ensure all traces are sent
print("[Logfire] Flushing traces to Scorecard...")
logfire.force_flush()
print("[Logfire] All traces sent. Check Scorecard for traces!")
