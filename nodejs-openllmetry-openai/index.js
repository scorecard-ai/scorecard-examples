import * as traceloop from "@traceloop/node-server-sdk";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI();

traceloop.initialize({
  disableBatch: true,
  instrumentModules: { openAI: OpenAI },
});

async function simpleWorkflow() {
  return traceloop.withWorkflow({ name: "simple_chat" }, async () => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Tell me a joke" }],
    });
    return completion.choices[0].message.content;
  });
}

simpleWorkflow();
