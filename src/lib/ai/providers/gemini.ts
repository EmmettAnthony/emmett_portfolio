import { BaseAIProvider, AICompletionRequest, AICompletionResponse } from "./base";

export class GeminiProvider extends BaseAIProvider {
  get name() { return "Google Gemini"; }

  private formatMessages(messages: { role: string; content: string }[]) {
    const contents: { role: string; parts: { text: string }[] }[] = [];
    for (const msg of messages) {
      if (msg.role === "system") continue; // system instructions passed separately
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      });
    }
    return contents;
  }

  private getSystemInstruction(messages: { role: string; content: string }[]): string | undefined {
    return messages.find((m) => m.role === "system")?.content;
  }

  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    const systemInstruction = this.getSystemInstruction(req.messages);
    const contents = this.formatMessages(req.messages);
    const apiKey = this.getApiKey();
    const model = this.config.model || "gemini-2.0-flash";

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? this.config.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? this.config.maxTokens ?? 4000,
      },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return {
      content: text,
      finishReason: data.candidates?.[0]?.finishReason,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }

  async *completeStream(req: AICompletionRequest): AsyncGenerator<string> {
    const systemInstruction = this.getSystemInstruction(req.messages);
    const contents = this.formatMessages(req.messages);
    const apiKey = this.getApiKey();
    const model = this.config.model || "gemini-2.0-flash";

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: req.temperature ?? this.config.temperature ?? 0.7,
        maxOutputTokens: req.maxTokens ?? this.config.maxTokens ?? 4000,
      },
    };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini stream error: ${response.status} - ${error}`);
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
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {
          // skip
        }
      }
    }
  }
}
