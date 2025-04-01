# Scorecard Tracing Example: Python Flask

A minimal Flask example showing how to trace LLM calls using OpenTelemetry to send traces to Scorecard. Uses OpenTelemetry's semantic conventions for GenAI.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/scorecard-ai/scorecard-examples.git
cd scorecard-examples/python-flask

# Create and activate virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install flask opentelemetry-api opentelemetry-sdk opentelemetry-instrumentation-flask opentelemetry-exporter-otlp-proto-http openai

# Start the server
python app.py

# In a new terminal, test the endpoint
curl -X POST http://localhost:4080/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Tell me about space"}'
```

## Viewing Results

1. Visit [Scorecard](https://app.getscorecard.ai)
2. Navigate to `/projects/[project-id]/traces` (replace with your project id)
3. Look for traces from "scorecard-example-python-flask" to see your LLM call

## Requirements

- Python 3.7+
- pip
