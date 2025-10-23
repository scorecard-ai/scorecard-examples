# Python Logfire + PydanticAI Example

Send OpenTelemetry traces from Logfire and PydanticAI to Scorecard.

## Prerequisites

- Python 3.8 or higher
- A Scorecard API key
- An OpenAI API key

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Update these environment variables in `main.py`:

```python
os.environ['OTEL_EXPORTER_OTLP_HEADERS'] = f'Authorization=Bearer <YOUR_SCORECARD_API_KEY>'
os.environ['OPENAI_API_KEY'] = "<YOUR_OPENAI_API_KEY>"
```

## Running the Example

```bash
python main.py
```

## How It Works

1. Set OTLP endpoint and API keys via environment variables (this tells Logfire to send traces to Scorecard)
2. Optionally configure Logfire to send traces just to Scorecard (`send_to_logfire=False`) or to both Logfire and Scorecard (`send_to_logfire=True`)
3. Call `logfire.instrument_pydantic_ai()` to instrument PydanticAI (this captures traces with semantic `gen_ai` conventions that can later be used in Scorecard)
4. Create and run your PydanticAI agent

Traces include request/response messages, token usage, model parameters, and latency.

## Resources

- [Logfire Documentation](https://logfire.pydantic.dev)
- [PydanticAI Documentation](https://ai.pydantic.dev)
