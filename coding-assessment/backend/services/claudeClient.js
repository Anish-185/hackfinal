import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env.js";

let client;

function getClient() {
  // Resolves ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / an `ant auth login` profile.
  client ??= new Anthropic();
  return client;
}

export class AiUnavailableError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "AiUnavailableError";
    this.status = 503;
    this.cause = cause;
  }
}

/**
 * Sends one request and returns the response parsed against `schema`
 * (structured outputs guarantee the text is valid JSON for that schema).
 */
export async function askForJson({ system, prompt, schema, effort = "medium", maxTokens = 16000 }) {
  let response;
  try {
    response = await getClient().beta.messages.create({
      model: config.ai.model,
      max_tokens: maxTokens,
      // If a safety classifier declines, the API retries on Anthropic's recommended fallback model.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort, format: { type: "json_schema", schema } },
      system,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiUnavailableError("AI is not configured: set ANTHROPIC_API_KEY on the backend", error);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiUnavailableError("AI is rate limited, try again shortly", error);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AiUnavailableError("Could not reach the AI service", error);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiUnavailableError(`AI request failed (${error.status})`, error);
    }
    // Anything else thrown by the client (e.g. no credentials configured at all).
    throw new AiUnavailableError(`AI is not available: ${error.message}`, error);
  }

  if (response.stop_reason === "refusal") {
    throw new AiUnavailableError("The AI declined this request");
  }
  if (response.stop_reason === "max_tokens") {
    throw new AiUnavailableError("The AI response was cut off; try again");
  }

  const text = response.content.find((block) => block.type === "text")?.text;
  if (!text) throw new AiUnavailableError("The AI returned no answer");
  return JSON.parse(text);
}
