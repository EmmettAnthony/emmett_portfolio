import { BaseAIProvider, AICompletionRequest, AICompletionResponse } from "./base";

export class AnthropicProvider extends BaseAIProvider {
  get name() { return "Anthropic"; }

  private getSystemPrompt(messages: { role: string; content: string }[]): string | undefined {
    const system = messages.find((m) => m.role === "system");
    return system?.content;
  }

  private getUserMessages(messages: { role: string; content: string }[]) {
    return messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const system = this.getSystemPrompt(req.messages);
    const messages = this.getUserMessages(req.messages);

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      max_tokens: req.maxTokens ?? this.config.maxTokens ?? 4000,
    };
    if (system) body.system = system;
    if (req.temperature ?? this.config.temperature) {
      body.temperature = req.temperature ?? this.config.temperature;
    }

    const response = await fetch(`${this.config.baseUrl || "https://api.anthropic.com/v1"}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.getApiKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text ?? "",
      finishReason: data.stop_reason,
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
    };
  }

  async *completeStream(req: AICompletionRequest): AsyncGenerator<string> {
    const system = this.getSystemPrompt(req.messages);
    const messages = this.getUserMessages(req.messages);

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      max_tokens: req.maxTokens ?? this.config.maxTokens ?? 4000,
      stream: true,
    };
    if (system) body.system = system;

    const response = await fetch(`${this.config.baseUrl || "https://api.anthropic.com/v1"}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.getApiKey(),
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic stream error: ${response.status} - ${error}`);
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
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          if (json.type === "content_block_delta" && json.delta?.text) {
            yield json.delta.text;
          }
        } catch {
          // skip
        }
      }
    }
  }
}
