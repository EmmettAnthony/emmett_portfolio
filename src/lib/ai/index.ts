import { BaseAIProvider, AIProviderConfig } from "./providers/base";
import { OpenAIProvider } from "./providers/openai";
import { AnthropicProvider } from "./providers/anthropic";
import { GeminiProvider } from "./providers/gemini";
import { OpenRouterProvider } from "./providers/openrouter";
import { OllamaProvider } from "./providers/ollama";
import { LMStudioProvider } from "./providers/lmstudio";
import { GroqProvider } from "./providers/groq";
import type { AIProviderType } from "@/types/chatbot";

const providerMap: Record<AIProviderType, new (config: AIProviderConfig) => BaseAIProvider> = {
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  gemini: GeminiProvider,
  openrouter: OpenRouterProvider,
  ollama: OllamaProvider,
  lmstudio: LMStudioProvider,
  groq: GroqProvider,
};

const envKeyMap: Record<AIProviderType, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  ollama: "", // no key needed for local
  lmstudio: "", // no key needed for local
  groq: "GROQ_API_KEY",
};

const defaultModels: Record<AIProviderType, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-haiku-20240307",
  gemini: "gemini-2.0-flash",
  openrouter: "openai/gpt-4o-mini",
  ollama: "llama3.2",
  lmstudio: "local-model",
  groq: "llama-3.3-70b-versatile",
};

export function createProvider(
  type: AIProviderType,
  config?: Partial<AIProviderConfig>
): BaseAIProvider {
  const Provider = providerMap[type];
  if (!Provider) {
    throw new Error(`Unknown AI provider: ${type}`);
  }

  const apiKeyEnv = envKeyMap[type];
  const apiKey = config?.apiKey || (apiKeyEnv ? process.env[apiKeyEnv] : undefined);

  const fullConfig: AIProviderConfig = {
    apiKey,
    model: config?.model || defaultModels[type],
    temperature: config?.temperature ?? 0.7,
    maxTokens: config?.maxTokens ?? 4000,
    ...(config?.baseUrl ? { baseUrl: config.baseUrl } : {}),
  };

  return new Provider(fullConfig);
}

export function getDefaultModel(type: AIProviderType): string {
  return defaultModels[type];
}

export { BaseAIProvider };
export type { AIProviderConfig, AICompletionRequest, AICompletionResponse } from "./providers/base";

// Provider-specific exports for direct use
export { OpenAIProvider } from "./providers/openai";
export { AnthropicProvider } from "./providers/anthropic";
export { GeminiProvider } from "./providers/gemini";
export { OpenRouterProvider } from "./providers/openrouter";
export { OllamaProvider } from "./providers/ollama";
export { LMStudioProvider } from "./providers/lmstudio";
export { GroqProvider } from "./providers/groq";
