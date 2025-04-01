import { ScorecardClient } from "scorecard-ai";
import { OpenAI } from "openai";

const SCORECARD_API_KEY = "replace-me";
const OPENAI_API_KEY = "replace-me";

// Initialize Scorecard client
const scorecard = new ScorecardClient({
  apiKey: SCORECARD_API_KEY,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const createTestset = async () => {
  const testset = await scorecard.testset.create({
    name: "Pokémon Testset",
    description: "A testset for evaluating Pokémon knowledge.",
  });

  await scorecard.testcase.create(testset.id, {
    userQuery: "What is the name of the first Pokémon?",
    ideal: "Bulbasaur",
  });

  await scorecard.testcase.create(testset.id, {
    userQuery: "What is type of Squirtle?",
    ideal: "Water",
  });

  await scorecard.testcase.create(testset.id, {
    userQuery: "Does Pikachu have a black stripe on his tail?",
    ideal: "No",
  });

  return testset;
};

const answerQuery = async (content) => {
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are Professor Oak, a Pokémon expert. Give concise answers to the user's question.",
      },
      { role: "user", content: content },
    ],
  });

  return chatCompletion.choices[0].message.content;
};

const testset = await createTestset();

const runTests = async ({ inputTestsetId, metricIds, modelInvocation }) => {
  const run = await scorecard.run.create({
    testsetId: inputTestsetId,
    metrics: metricIds,
  });

  const testcases = await scorecard.testset.getTestcases(inputTestsetId);

  await scorecard.run.updateStatus(run.id, {
    status: "running_execution",
  });

  // Process all test cases in parallel
  await Promise.all(
    testcases.results.map(async (testcase) => {
      const modelResponse = await modelInvocation(testcase.userQuery);

      await scorecard.testrecord.create(run.id, {
        testcaseId: testcase.id,
        testsetId: inputTestsetId,
        userQuery: testcase.userQuery,
        context: testcase.context,
        ideal: testcase.ideal,
        response: modelResponse,
      });
    })
  );

  await scorecard.run.updateStatus(run.id, {
    status: "awaiting_scoring",
  });
};

runTests({
  inputTestsetId: testset.id,
  metricIds: [2], // Have to manually create metrics in the UI and get the ID
  modelInvocation: (prompt) => answerQuery(prompt),
});
