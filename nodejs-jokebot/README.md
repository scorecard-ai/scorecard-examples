# 🎭 Joke Bot - Your First Scorecard System

Build and compare AI systems in 5 minutes.

## Quick Start

1. **Install and configure**

   ```bash
   npm install
   cp .env.example .env
   # Add your API keys to .env
   ```

2. **Create everything**

   ```bash
   node setup.js
   ```

This script will create a project in your Scorecard organization containing the demo system and a couple of example system configs. These will be saved in eval-params.json.

3. **Try it locally**

   ```bash
   node system.js "pizza"
   ```

4. **Run your first evaluation**
   ```bash
   node eval.js
   ```

## What Just Happened?

You created a **System** - a testable AI component with:

- **Inputs**: `{ topic: "pizza" }`
- **Config**: `{ model: "gpt-4.1-nano" }`
- **Output**: `{ joke: "..." }`

Then you created two **Configurations** to compare:

- Config A: Uses gpt-4.1-nano (faster, cheaper)
- Config B: Uses gpt-4.1 (smarter, costlier)

Finally, you ran an **Experiment** to see which model tells better jokes!

## The Key Insight

Instead of manually testing "Does GPT-4.1 tell better jokes?", you:

1. Defined your system once
2. Created configurations to compare
3. Let Scorecard run the experiment

Now you can see side-by-side results and make data-driven decisions.

## Adding Metrics for Automated Scoring

To get automated quality scores for your joke outputs:

1. **Create an LLM-as-a-Judge metric** in the Scorecard UI:

   - Go to your project in Scorecard
   - Navigate to the Metrics section
   - Create a new metric that evaluates joke quality (e.g., "How funny is this joke on a scale of 1-5?\n{{outputs.joke}}")

2. **Add the metric ID to your config**:

   - Copy the metric ID from the UI
   - Add it to the `metricIds` array in `eval-params.json`:

   ```json
   {
     "projectId": "173",
     "systemId": "...",
     "testsetId": "...",
     "metricIds": ["your-metric-id-here"]
   }
   ```

3. **Run evaluation with metrics**:
   ```bash
   node eval.js
   ```

Now your experiments will include automated scoring alongside the raw outputs!

## Next Steps

- View your results in Scorecard
- Add more test topics
- Try different models
- Create custom metrics for your use case
- Build your own system!
