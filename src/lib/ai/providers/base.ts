export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AICompletionRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class BaseAIProvider {
  protected config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    };
  }

  abstract get name(): string;
  abstract complete(req: AICompletionRequest): Promise<AICompletionResponse>;
  abstract completeStream(req: AICompletionRequest): AsyncGenerator<string, void, unknown>;

  protected getApiKey(): string {
    if (!this.config.apiKey) {
      throw new Error(`API key not configured for ${this.name}`);
    }
    return this.config.apiKey;
  }

  protected buildSystemMessage(systemPrompt?: string): { role: "system"; content: string } | null {
    if (!systemPrompt) return null;
    return { role: "system", content: systemPrompt };
  }

  buildMessages(messages: AICompletionRequest["messages"], systemPrompt?: string) {
    const system = this.buildSystemMessage(systemPrompt);
    return system ? [system, ...messages] : messages;
  }
}

export type AIProviderConstructor = new (config: AIProviderConfig) => BaseAIProvider;
