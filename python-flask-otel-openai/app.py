# Import required dependencies
from flask import Flask, request, jsonify
import time
import random
# OpenAI SDK for making API calls
from openai import OpenAI

# OpenTelemetry imports for tracing and monitoring
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes
from opentelemetry.instrumentation.flask import FlaskInstrumentor

# Configuration constants
# Scorecard telemetry endpoint for sending trace data
SCORECARD_TELEMETRY_URL = "https://telemetry.getscorecard.ai:4318/v1/traces"
SCORECARD_TELEMETRY_KEY = "replace-me" # replace with your Scorecard telemetry key
OPENAI_API_KEY = "replace-me" # replace with your OpenAI API key

# Set up OpenTelemetry tracing
# Create a tracer provider with service information and Scorecard project ID
provider = TracerProvider(
    resource=Resource.create({
        ResourceAttributes.SERVICE_NAME: "scorecard-python-flask-otel-openai",
        ResourceAttributes.SERVICE_VERSION: "0.0.1",
        "scorecard.project_id": "replace-me" # replace with your Scorecard project ID
    })
)

# Configure the OpenTelemetry exporter to send traces to Scorecard
provider.add_span_processor(BatchSpanProcessor(
    OTLPSpanExporter(
        endpoint=SCORECARD_TELEMETRY_URL,
        headers={"Authorization": f"Bearer {SCORECARD_TELEMETRY_KEY}"}
    )
))

# Set the global tracer provider and get a tracer instance
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("gen-ai")

# Initialize Flask application and instrument it for tracing
app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def generate(prompt):
    """
    Make an LLM API call to OpenAI with OpenTelemetry semantic conventions for GenAI.
    
    Args:
        prompt (str): The input prompt for the AI
    Returns:
        str: The generated response
    """
    # Start a new span for tracking the LLM call
    with tracer.start_as_current_span("llm_call") as span:
        # Add attributes to the span for better observability
        span.set_attribute("openinference.span.kind", "LLM")
        span.set_attribute("gen_ai.request.model", "gpt-3.5-turbo")
        span.set_attribute("gen_ai.request.max_tokens", 1024)
        span.set_attribute("gen_ai.prompt.0.content", prompt)
        
        # Make the API call to OpenAI
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1024
        )

        # Extract response and token usage information
        response = completion.choices[0].message.content
        prompt_tokens = completion.usage.prompt_tokens
        response_tokens = completion.usage.completion_tokens
        total_tokens = completion.usage.total_tokens
        
        # Record completion details and token usage in the span
        span.set_attribute("gen_ai.completion.0.content", response)
        span.set_attribute("llm.token_count.prompt", prompt_tokens)
        span.set_attribute("llm.token_count.completion", response_tokens)
        span.set_attribute("llm.token_count.total", total_tokens)
        
        return response

# Define API endpoint for text generation
@app.route('/generate', methods=['POST'])
def handler():
    prompt = request.json.get('prompt', 'Tell me something interesting')
    return jsonify({
        'prompt': prompt,
        'response': generate(prompt)
    })

# Start the server
if __name__ == '__main__':
    print(f"🚀 Scorecard example running at http://localhost:4080")    
    app.run(host='0.0.0.0', port=4080, debug=True)
