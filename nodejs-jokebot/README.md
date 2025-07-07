# 🎭 Joke Bot - Your First Scorecard System

Build and compare AI systems in 5 minutes.

## Quick Start

1. **Install and configure**

```sh
npm install
cp .env.example .env
# Add your Scorecard and OpenAI API keys to .env
```

2. **Create everything**

```sh
node setup.js
```

This script will create a project in your Scorecard organization containing the demo system, some test cases, an LLM-as-a-judge metric, and a couple of example system versions. These will be saved in eval-params.json.

3. **Try it locally**

```sh
node system.js "pizza"
```

4. **Run your first evaluation**

```sh
node eval.js
```

## What Just Happened?

You created a **System** - a testable AI component with the config:

```json
{
   model: "gpt-4.1",
   style: "dad-joke",
   temperature: 0.9
}
```

This is the production config, named "Version 1" by default.

Then you created `Dad joke nano`, another **System Version** so that you could compare:

- "Version 1", which uses `gpt-4.1` (smarter, more expensive)
- "Dad joke nano", which uses `gpt-4.1-nano` (faster, cheaper)

Finally, you ran an **Experiment** to see which model tells better jokes!

## The Key Insight

Instead of manually testing "Does GPT-4.1 tell better jokes?", you:

1. Created a system once
2. Created an experimental system version
3. Let Scorecard run the experiment

Now you can see side-by-side results with automated scoring and make data-driven decisions.

## Next Steps

- View your results in Scorecard
- Add more test topics
- Try different models
- Create custom metrics for your use case
- Build your own system!
