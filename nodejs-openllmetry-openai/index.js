import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI();

traceloop.initialize({
  disableBatch: true,
  instrumentModules: { openAI: OpenAI },
});

async function createJoke() {
  return await traceloop.withTask({ name: "joke_creation" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Tell me a joke" }],
    });

    return completion.choices[0].message.content;
  });
}

async function generateAuthor(joke) {
  return await traceloop.withTask({ name: "author_generation" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: `add a author to the joke:\n\n${joke}` },
      ],
    });

    return completion.choices[0].message.content;
  });
}

async function joke_workflow() {
  return await traceloop.withWorkflow({ name: "joke_generator" }, async () => {
    const joke = await createJoke();
    await generateAuthor(joke);
  });
}

joke_workflow();
