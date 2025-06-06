import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import dotenv from 'dotenv';

dotenv.config();

export async function runJokeBot(input, config) {
  const { text } = await generateText({
    model: openai(config.model),
    prompt: `Tell a short, funny joke about ${input.topic}.`,
    temperature: 0.8,
    maxTokens: 100,
  });

  return {
    joke: text.trim(),
  };
}

// Test locally
if (import.meta.url === `file://${process.argv[1]}`) {
  const topic = process.argv[2] || 'programming';
  const result = await runJokeBot({ topic }, { model: 'gpt-4.1-mini' });
  console.log(`\n${result.joke}\n`);
}
