# Python Claude Agent SDK with Multi-Step Workflow + OpenTelemetry

Build a multi-step research agent using the Claude Agent SDK with OpenTelemetry observability.

## Prerequisites

- Python 3.9 or higher
- A Scorecard API key
- An Anthropic API key
- `ANTHROPIC_API_KEY` environment variable set

## Installation

Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Configuration

Set environment variables:

```bash
export ANTHROPIC_API_KEY="your_anthropic_api_key"
```

Update `main.py` with your Scorecard API key:

```python
OTLPSpanExporter(
    endpoint="https://tracing.scorecard.io/otel",
    headers={"Authorization": "Bearer <YOUR_SCORECARD_API_KEY>"}
)
```

## Running the Example

```bash
python main.py
```

## How It Works

This example demonstrates a **multi-step research workflow** using the Claude Agent SDK with OpenTelemetry observability:

### Multi-Step Workflow

The agent performs research in 4 steps:

1. **Gather Facts** - Collect initial information about cats
2. **Identify Angles** - Find the most interesting fact
3. **Deep Dive** - Research the selected topic in depth
4. **Synthesize** - Create a compelling summary

Each step is:
- Wrapped in an OpenTelemetry span for observability
- Executed by the Claude Agent SDK
- Tracked with custom attributes (step name, prompt/output length, success)

### Code Structure

```python
# Trace each agent step
@tracer.start_as_current_span("agent.step")
async def run_agent_step(agent, step_name, prompt):
    # Set step metadata
    span.set_attributes({
        "agent.step.name": step_name,
        "agent.step.prompt_length": len(prompt),
    })
    
    # Run agent
    result = await agent.run(prompt)
    return result

# Orchestrate multi-step workflow
@tracer.start_as_current_span("research-workflow")
async def research_cats_workflow():
    # Create agent with tools and system prompt
    agent = Agent(...)
    
    # Execute steps sequentially
    facts = await run_agent_step(agent, "gather_facts", "...")
    angles = await run_agent_step(agent, "identify_angles", f"Based on {facts}...")
    # ... more steps
```

### Custom Attributes Captured

The example captures workflow and agent-specific attributes:

#### Workflow Attributes
- `workflow.name` - Name of the research workflow
- `workflow.steps` - Total number of steps
- `workflow.success` - Whether the workflow completed successfully

#### Agent Step Attributes
- `agent.step.name` - Name of the current step (e.g., "gather_facts", "deep_dive")
- `agent.step.prompt_length` - Length of the input prompt
- `agent.step.output_length` - Length of the output
- `agent.step.success` - Whether the step completed successfully

These custom attributes help you:
- Track which steps take the longest
- Identify failure points in multi-step workflows
- Monitor prompt/output sizes across steps
- Understand agent behavior patterns

### Span Structure

```
research-workflow (root span)
├── workflow.name: research-cats
├── workflow.steps: 4
├── workflow.success: true
│
├── agent.step (gather_facts)
│   ├── agent.step.name: gather_facts
│   ├── agent.step.prompt_length: 67
│   └── agent.step.output_length: 423
│
├── agent.step (identify_angles)
│   ├── agent.step.name: identify_angles
│   └── agent.step.success: true
│
├── agent.step (deep_dive)
│   └── ...
│
└── agent.step (synthesize)
    └── ...
```

## Why Claude Agent SDK?

✅ **Multi-step workflows** - Easily chain multiple agent interactions  
✅ **Built-in tools** - File operations, code execution, web search  
✅ **Context management** - Automatic context window handling  
✅ **System prompts** - Define agent personality and expertise  
✅ **Production-ready** - Error handling, session management built-in

## Why Add OpenTelemetry?

✅ **Observability** - See how your agent performs each step  
✅ **Debugging** - Identify slow or failing steps  
✅ **Monitoring** - Track agent behavior in production  
✅ **Analytics** - Understand usage patterns and costs  
✅ **Integration** - Send traces to Scorecard for evaluation

## Resources

- [Claude Agent SDK Documentation](https://docs.claude.com/en/api/agent-sdk/overview)
- [Claude Agent SDK Python](https://docs.claude.com/en/api/agent-sdk/python-sdk)
- [OpenTelemetry Python SDK](https://opentelemetry.io/docs/instrumentation/python/)
- [Building Multi-Step Agents Guide](https://docs.claude.com/en/api/agent-sdk/guides)
