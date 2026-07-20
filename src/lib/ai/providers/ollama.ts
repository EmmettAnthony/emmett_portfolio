import { BaseAIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from "./base";

export class OllamaProvider extends BaseAIProvider {
  get name() { return "Ollama"; }

  constructor(config: AIProviderConfig) {
    super({
      baseUrl: "http://localhost:11434",
      temperature: 0.7,
      maxTokens: 4000,
      model: config.model || "llama3.2",
      apiKey: config.apiKey,
    });
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const messages = this.buildMessages(req.messages).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        options: {
          temperature: req.temperature ?? this.config.temperature,
          num_predict: req.maxTokens ?? this.config.maxTokens,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content ?? "",
      finishReason: data.done ? "stop" : undefined,
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
    };
  }

  async *completeStream(req: AICompletionRequest): AsyncGenerator<string> {
    const messages = this.buildMessages(req.messages).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        options: {
          temperature: req.temperature ?? this.config.temperature,
          num_predict: req.maxTokens ?? this.config.maxTokens,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama stream error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
          if (json.message?.content) yield json.message.content;
        } catch {
          // skip
        }
      }
    }
  }
}
