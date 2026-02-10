# Python Gemini + Traceloop Example

Send OpenTelemetry traces from Google Gemini API calls to Scorecard using [OpenLLMetry](https://github.com/traceloop/openllmetry) (Traceloop SDK).

## Prerequisites

- Python 3.8 or higher
- A Scorecard API key
- A Google Gemini API key

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

Then update `.env` with your credentials:

```bash
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>

TRACELOOP_BASE_URL=https://tracing.scorecard.io/otel
TRACELOOP_HEADERS=Authorization=Bearer%20ak_<YOUR_SCORECARD_API_KEY>
SCORECARD_PROJECT_ID=<YOUR_SCORECARD_PROJECT_ID>
```

## Running the Example

```bash
python main.py
```

## How It Works

1. **Initialize Traceloop** before importing `google.genai` so the SDK can monkey-patch the client for automatic instrumentation
2. **Configure the OTLP endpoint** via `TRACELOOP_BASE_URL` and `TRACELOOP_HEADERS` environment variables to send traces to Scorecard
3. **Use the `@workflow` decorator** to group related LLM calls into a single trace
4. **Make Gemini API calls** — Traceloop automatically captures request/response data, token usage, and model parameters

### What the Example Demonstrates

- **Simple prompt** — A basic `generate_content` call
- **Tool/function calling** — Declaring a tool and receiving a function call from the model
- **Tool result handling** — Sending a function response back to the model for a final answer
