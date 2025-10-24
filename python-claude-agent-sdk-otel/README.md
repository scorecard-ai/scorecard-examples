# Python Claude Agent SDK with Multi-Step Workflow + OpenTelemetry

A multi-step research agent using the Claude Agent SDK that sends OpenTelemetry traces to Scorecard.

There are three steps:

1. List 5 interesting facts about cats.
2. What is the most surprising fact and why?
3. Create a brief summary.

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Set environment variables in `main.py`:

* `SCORECARD_API_KEY`
* `SCORECARD_PROJECT_ID`
* `ANTHROPIC_API_KEY`

Or export them before running:

```bash
export SCORECARD_API_KEY="your_scorecard_api_key"
export SCORECARD_PROJECT_ID="your_anthropic_api_key"
export ANTHROPIC_API_KEY="your_anthropic_api_key"
```

## Run

Run with:

```bash
python main.py
```
