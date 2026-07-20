import { OpenAIProvider } from "./openai";

export class OpenRouterProvider extends OpenAIProvider {
  get name() { return "OpenRouter"; }

  constructor(config: { apiKey?: string; model: string; temperature?: number; maxTokens?: number }) {
    super({
      ...config,
      baseUrl: "https://openrouter.ai/api/v1",
    });
  }

  async complete(req: import("./base").AICompletionRequest): Promise<import("./base").AICompletionResponse> {
    const baseUrl = this.config.baseUrl || "https://openrouter.ai/api/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getApiKey()}`,
        "HTTP-Referer": "https://emmettanthony.dev",
        "X-Title": "Emmett Anthony Chatbot",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.buildMessages(req.messages),
        temperature: req.temperature ?? this.config.temperature,
        max_tokens: req.maxTokens ?? this.config.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      finishReason: data.choices[0].finish_reason,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  async *completeStream(req: import("./base").AICompletionRequest): AsyncGenerator<string> {
    const baseUrl = this.config.baseUrl || "https://openrouter.ai/api/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.getApiKey()}`,
        "HTTP-Referer": "https://emmettanthony.dev",
        "X-Title": "Emmett Anthony Chatbot",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: this.buildMessages(req.messages),
        temperature: req.temperature ?? this.config.temperature,
        max_tokens: req.maxTokens ?? this.config.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter stream error: ${response.status} - ${error}`);
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
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // skip
        }
      }
    }
  }
}
