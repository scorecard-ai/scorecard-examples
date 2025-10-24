# Python Claude Agent SDK with Multi-Step Workflow + OpenTelemetry

A multi-step research agent using the Claude Agent SDK with OpenTelemetry observability.

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Set environment variables in `main.py`:

```python
SCORECARD_API_KEY = os.getenv("SCORECARD_API_KEY", "<YOUR_SCORECARD_API_KEY>")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "<YOUR_ANTHROPIC_API_KEY>")
SCORECARD_PROJECT_ID = "<YOUR_SCORECARD_PROJECT_ID>"
```

Or export them before running:

```bash
export SCORECARD_API_KEY="your_scorecard_api_key"
export ANTHROPIC_API_KEY="your_anthropic_api_key"
```

## Running

Run directly:

```bash
python main.py
```

Or use the convenience script:

```bash
./run.sh
```

The example runs a 3-step research workflow about cats and sends traces to Scorecard.
