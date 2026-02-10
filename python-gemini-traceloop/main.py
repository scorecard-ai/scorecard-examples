import os
from dotenv import load_dotenv

# 1. Load .env first
load_dotenv()

# 2. Initialize Traceloop before importing/using genai so monkey-patching is in place
from traceloop.sdk import Traceloop
from traceloop.sdk.decorators import workflow

Traceloop.init(
    app_name="vertex-tracing-demo",
    disable_batch=True,
    resource_attributes={"scorecard.project_id": os.getenv("SCORECARD_PROJECT_ID")},
)

# 3. Now import and use genai
from google import genai
from google.genai.types import (
    Content,
    FunctionDeclaration,
    FunctionResponse,
    GenerateContentConfig,
    Part,
    Tool,
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


@workflow(name="conversation")
def run_conversation():
    # --- Call 1: Simple prompt ---
    print("=== Call 1: Simple prompt ===")
    response1 = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Explain quantum entanglement in two sentences.",
    )
    print(response1.text)
    print(
        f"Tokens — input: {response1.usage_metadata.prompt_token_count}, "
        f"output: {response1.usage_metadata.candidates_token_count}\n"
    )

    # --- Call 2: Tool call (function calling) ---
    print("=== Call 2: Tool call ===")
    weather_tool = Tool(
        function_declarations=[
            FunctionDeclaration(
                name="get_weather",
                description="Get the current weather for a given location.",
                parameters={
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string",
                            "description": "City and state, e.g. San Francisco, CA",
                        },
                    },
                    "required": ["location"],
                },
            ),
        ],
    )
    response2 = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What's the weather like in San Francisco?",
        config=GenerateContentConfig(tools=[weather_tool]),
    )
    # Model should return a function call
    part = response2.candidates[0].content.parts[0]
    print(f"Function call: {part.function_call.name}({dict(part.function_call.args)})")
    print(
        f"Tokens — input: {response2.usage_metadata.prompt_token_count}, "
        f"output: {response2.usage_metadata.candidates_token_count}\n"
    )

    # --- Call 3: Send tool result back ---
    print("=== Call 3: Tool result ===")

    response3 = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            Content(
                role="user",
                parts=[Part(text="What's the weather like in San Francisco?")],
            ),
            Content(role="model", parts=[part]),
            Content(
                role="user",
                parts=[
                    Part(
                        function_response=FunctionResponse(
                            name="get_weather",
                            response={
                                "temperature": 62,
                                "unit": "fahrenheit",
                                "condition": "foggy",
                            },
                        )
                    )
                ],
            ),
        ],
        config=GenerateContentConfig(tools=[weather_tool]),
    )
    print(response3.text)
    print(
        f"Tokens — input: {response3.usage_metadata.prompt_token_count}, "
        f"output: {response3.usage_metadata.candidates_token_count}"
    )


run_conversation()
