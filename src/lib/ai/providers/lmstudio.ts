import { OpenAIProvider } from "./openai";

export class LMStudioProvider extends OpenAIProvider {
  get name() { return "LM Studio"; }

  constructor(config: { model: string; temperature?: number; maxTokens?: number }) {
    super({
      baseUrl: "http://localhost:1234/v1",
      model: config.model || "local-model",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4000,
    });
  }
}
