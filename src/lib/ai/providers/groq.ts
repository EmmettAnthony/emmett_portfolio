import { OpenAIProvider } from "./openai";

export class GroqProvider extends OpenAIProvider {
  get name() { return "Groq"; }

  constructor(config: { apiKey?: string; model: string; temperature?: number; maxTokens?: number }) {
    super({
      ...config,
      baseUrl: "https://api.groq.com/openai/v1",
    });
  }
}
