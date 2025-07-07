import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import dotenv from "dotenv";

dotenv.config();

const STYLE_DESCRIPTIONS = {
  witty: "short, clever and witty",
  "dad-joke": "cheesy dad joke that's punny and groan-worthy",
};

/**
 * Run the joke bot with the given input and config.
 *
 * @param {{ topic: string }} input - The input for the joke bot.
 * @param {{ model: string, style: string, temperature: number }} config - The configuration for the AI system.
 * @returns {Promise<{ joke: string }>} The joke string.
 */
export async function runJokeBot(input, config) {
  const { text } = await generateText({
    model: openai(config.model),
    prompt: `Tell me a joke about ${input.topic}.${
      config.style ? ` Style: ${STYLE_DESCRIPTIONS[config.style]}` : ""
    }`,
    temperature: config.temperature,
    maxTokens: 100,
  });

  return {
    joke: text.trim(),
  };
}

// Test locally
if (import.meta.url === `file://${process.argv[1]}`) {
  const topic = process.argv[2] || "programming";
  const result = await runJokeBot(
    { topic },
    {
      model: "gpt-4.1-mini",
      style: "witty",
      temperature: 0.8,
    }
  );
  console.log(`\n${result.joke}\n`);
}
