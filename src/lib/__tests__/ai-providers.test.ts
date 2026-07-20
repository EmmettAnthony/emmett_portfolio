import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BaseAIProvider, AIProviderConfig, AICompletionRequest, AICompletionResponse } from "../ai/providers/base";

class TestProvider extends BaseAIProvider {
  get name() { return "Test"; }
  async complete(req: AICompletionRequest): Promise<AICompletionResponse> {
    return { content: "test response" };
  }
  async *completeStream(req: AICompletionRequest): AsyncGenerator<string> {
    yield "chunk1";
    yield "chunk2";
  }
}

function mockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  return {
    ok: true,
    body: {
      getReader() {
        let i = 0;
        return {
          read() {
            if (i >= chunks.length)
              return Promise.resolve({ done: true, value: undefined });
            return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) });
          },
        };
      },
    },
  };
}

function mockErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    text: () => Promise.resolve(body),
  };
}

function mockJsonResponse(data: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  };
}

describe("BaseAIProvider", () => {
  it("applies default temperature and maxTokens", () => {
    const provider = new TestProvider({ model: "test-model" });
    expect(provider["config"].temperature).toBe(0.7);
    expect(provider["config"].maxTokens).toBe(4000);
    expect(provider["config"].model).toBe("test-model");
  });

  it("allows overriding defaults via config", () => {
    const provider = new TestProvider({
      model: "test-model",
      temperature: 0.5,
      maxTokens: 2000,
    });
    expect(provider["config"].temperature).toBe(0.5);
    expect(provider["config"].maxTokens).toBe(2000);
  });

  it("stores apiKey when provided", () => {
    const provider = new TestProvider({ model: "m", apiKey: "sk-abc" });
    expect(provider["config"].apiKey).toBe("sk-abc");
  });

  it("stores baseUrl when provided", () => {
    const provider = new TestProvider({ model: "m", baseUrl: "http://localhost" });
    expect(provider["config"].baseUrl).toBe("http://localhost");
  });

  describe("getApiKey", () => {
    it("returns the configured api key", () => {
      const provider = new TestProvider({ model: "m", apiKey: "sk-secret" });
      expect(provider["getApiKey"]()).toBe("sk-secret");
    });

    it("throws if no apiKey is configured", () => {
      const provider = new TestProvider({ model: "m" });
      expect(() => provider["getApiKey"]()).toThrow("API key not configured for Test");
    });
  });

  describe("buildSystemMessage", () => {
    it("returns null if no system prompt", () => {
      const provider = new TestProvider({ model: "m" });
      expect(provider["buildSystemMessage"]()).toBeNull();
      expect(provider["buildSystemMessage"]("")).toBeNull();
    });

    it("returns a system message object when prompt is given", () => {
      const provider = new TestProvider({ model: "m" });
      const result = provider["buildSystemMessage"]("You are a helpful assistant");
      expect(result).toEqual({ role: "system", content: "You are a helpful assistant" });
    });
  });

  describe("buildMessages", () => {
    it("returns messages unchanged when no system prompt", () => {
      const provider = new TestProvider({ model: "m" });
      const messages = [{ role: "user" as const, content: "hello" }];
      expect(provider.buildMessages(messages)).toEqual(messages);
    });

    it("prepends system message when system prompt is provided", () => {
      const provider = new TestProvider({ model: "m" });
      const messages = [{ role: "user" as const, content: "hello" }];
      const result = provider.buildMessages(messages, "Be concise");
      expect(result).toEqual([
        { role: "system", content: "Be concise" },
        { role: "user", content: "hello" },
      ]);
    });
  });

  describe("name accessor", () => {
    it("returns the provider name", () => {
      const provider = new TestProvider({ model: "m" });
      expect(provider.name).toBe("Test");
    });
  });

  describe("complete", () => {
    it("returns a response from the implementation", async () => {
      const provider = new TestProvider({ model: "m" });
      const res = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(res).toEqual({ content: "test response" });
    });
  });

  describe("completeStream", () => {
    it("yields chunks from the implementation", async () => {
      const provider = new TestProvider({ model: "m" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["chunk1", "chunk2"]);
    });
  });
});

describe("OpenAIProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns OpenAI", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      expect(provider.name).toBe("OpenAI");
    });
  });

  describe("complete", () => {
    it("sends a POST request to the correct endpoint and returns the response", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "Hello!" }, finish_reason: "stop" }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const result = await provider.complete({
        messages: [{ role: "user", content: "Say hi" }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-test",
          },
          body: expect.stringContaining('"model":"gpt-4"'),
        })
      );
      expect(result).toEqual({
        content: "Hello!",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      });
    });

    it("uses custom baseUrl when configured", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({
        model: "gpt-4",
        apiKey: "sk-test",
        baseUrl: "https://custom.example.com/v1",
      });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.example.com/v1/chat/completions",
        expect.anything()
      );
    });

    it("uses request temperature over config", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({
        model: "gpt-4",
        apiKey: "sk-test",
        temperature: 0.7,
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.3,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.3);
    });

    it("defaults temperature to config value when request does not specify", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({
        model: "gpt-4",
        apiKey: "sk-test",
        temperature: 0.5,
      });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.5);
    });

    it("uses max_tokens from request when provided", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 100,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(100);
    });

    it("buildMessages prepends system message when system prompt passed", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");

      class OpenAIProviderWithSystem extends OpenAIProvider {
        async complete(req: AICompletionRequest) {
          const response = await fetch(
            `${this.config.baseUrl || "https://api.openai.com/v1"}/chat/completions`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.getApiKey()}`,
              },
              body: JSON.stringify({
                model: this.config.model,
                messages: this.buildMessages(req.messages, "You are a bot"),
                temperature: req.temperature ?? this.config.temperature,
                max_tokens: req.maxTokens ?? this.config.maxTokens,
                stream: false,
              }),
            }
          );
          if (!response.ok) {
            const error = await response.text();
            throw new Error("OpenAI API error: " + response.status + " - " + error);
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
      }

      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProviderWithSystem({
        model: "gpt-4",
        apiKey: "sk-test",
      });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toEqual([
        { role: "system", content: "You are a bot" },
        { role: "user", content: "hi" },
      ]);
    });

    it("includes stream: false in the body", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(false);
    });

    it("throws on HTTP error", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(mockErrorResponse(401, "Unauthorized"));

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "bad-key" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("OpenAI API error: 401 - Unauthorized");
    });

    it("throws when no API key", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      const provider = new OpenAIProvider({ model: "gpt-4" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for OpenAI");
    });

    it("handles missing usage data gracefully", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [{ message: { content: "Hello!" }, finish_reason: "stop" }],
        })
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(result.usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    });
  });

  describe("completeStream", () => {
    it("yields content from SSE chunks", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("sets stream: true in the request body", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });

    it("uses custom baseUrl in stream", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new OpenAIProvider({
        model: "gpt-4",
        apiKey: "sk-test",
        baseUrl: "https://custom.example.com/v1",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.example.com/v1/chat/completions",
        expect.anything()
      );
    });

    it("skips empty lines and non-data lines", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n",
          " \n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"B\"}}]}\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A", "B"]);
    });

    it("handles multi-line chunks split across reads", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\ndata: {\"choi",
          "ces\":[{\"delta\":{\"content\":\" world\"}}]}\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("skips malformed JSON chunks", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: not-json\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"B\"}}]}\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A", "B"]);
    });

    it("throws on HTTP error", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(mockErrorResponse(429, "Rate limited"));

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("OpenAI stream error: 429 - Rate limited");
    });

    it("throws when no response body", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue({ ok: true });

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("No response body");
    });

    it("throws when no API key", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      const provider = new OpenAIProvider({ model: "gpt-4" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("API key not configured for OpenAI");
    });

    it("skips chunks with no delta content", async () => {
      const { OpenAIProvider } = await import("../ai/providers/openai");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{}}]}\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new OpenAIProvider({ model: "gpt-4", apiKey: "sk-test" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });
  });
});

describe("AnthropicProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns Anthropic", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      expect(provider.name).toBe("Anthropic");
    });
  });

  describe("complete", () => {
    it("sends correct request and returns response", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Hello from Claude" }],
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 20 },
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const result = await provider.complete({
        messages: [{ role: "user", content: "Say hi" }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.anthropic.com/v1/messages",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": "sk-ant-test",
            "anthropic-version": "2023-06-01",
          },
          body: expect.stringContaining('"model":"claude-3"'),
        })
      );
      expect(result).toEqual({
        content: "Hello from Claude",
        finishReason: "end_turn",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });
    });

    it("includes system prompt when present in messages", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      await provider.complete({
        messages: [
          { role: "system", content: "You are Claude" },
          { role: "user", content: "hi" },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.system).toBe("You are Claude");
      expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    });

    it("filters out system messages from messages array", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      await provider.complete({
        messages: [
          { role: "system", content: "Sys" },
          { role: "user", content: "hi" },
          { role: "assistant", content: "ok" },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toEqual([
        { role: "user", content: "hi" },
        { role: "assistant", content: "ok" },
      ]);
    });

    it("defaults max_tokens when neither request nor config specifies it", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(4000);
    });

    it("uses max_tokens from request over config", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
        maxTokens: 2000,
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        maxTokens: 500,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.max_tokens).toBe(500);
    });

    it("only includes temperature when it is truthy", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.7);
    });

    it("omits temperature when request temperature is 0", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBeUndefined();
    });

    it("uses custom baseUrl when configured", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ text: "Ok" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
        baseUrl: "https://custom.anthropic.com",
      });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://custom.anthropic.com/messages",
        expect.anything()
      );
    });

    it("throws on HTTP error", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(mockErrorResponse(401, "Invalid API key"));

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "bad-key",
      });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("Anthropic API error: 401 - Invalid API key");
    });

    it("returns empty content when no text in response", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          content: [{ not_text: "nope" }],
          stop_reason: "end_turn",
        })
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(result.content).toBe("");
    });

    it("throws when no API key", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      const provider = new AnthropicProvider({ model: "claude-3" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for Anthropic");
    });
  });

  describe("completeStream", () => {
    it("yields text from content_block_delta events", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"Hello\"}}\n",
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\" world\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("includes system prompt in stream request", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"Ok\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [
          { role: "system", content: "Be concise" },
          { role: "user", content: "hi" },
        ],
      })) {
        chunks.push(chunk);
      }

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.system).toBe("Be concise");
      expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    });

    it("includes stream: true in body", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"Ok\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });

    it("skips non-delta events", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"type\":\"ping\"}\n",
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"A\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("skips lines without data: prefix", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "event: ping\n",
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"A\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("skips malformed JSON chunks", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: not-json\n",
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"A\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("skips delta events without text", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"type\":\"content_block_delta\",\"delta\":{}}\n",
          "data: {\"type\":\"content_block_delta\",\"delta\":{\"text\":\"A\"}}\n",
        ])
      );

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("throws on HTTP error", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue(mockErrorResponse(429, "Too fast"));

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("Anthropic stream error: 429 - Too fast");
    });

    it("throws when no response body", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      mockFetch.mockResolvedValue({ ok: true });

      const provider = new AnthropicProvider({
        model: "claude-3",
        apiKey: "sk-ant-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("No response body");
    });

    it("throws when no API key", async () => {
      const { AnthropicProvider } = await import("../ai/providers/anthropic");
      const provider = new AnthropicProvider({ model: "claude-3" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("API key not configured for Anthropic");
    });
  });
});

describe("GeminiProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns Google Gemini", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      expect(provider.name).toBe("Google Gemini");
    });
  });

  describe("complete", () => {
    it("sends correct request and returns response", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [
            {
              content: { parts: [{ text: "Hello from Gemini" }] },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
          },
        })
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const result = await provider.complete({
        messages: [{ role: "user", content: "Say hi" }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIza-test",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(result).toEqual({
        content: "Hello from Gemini",
        finishReason: "STOP",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });
    });

    it("converts assistant role to model role", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [{ content: { parts: [{ text: "Ok" }] } }],
        })
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      await provider.complete({
        messages: [
          { role: "assistant", content: "Hello" },
          { role: "user", content: "hi" },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.contents).toEqual([
        { role: "model", parts: [{ text: "Hello" }] },
        { role: "user", parts: [{ text: "hi" }] },
      ]);
    });

    it("skips system messages and passes them as systemInstruction", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [{ content: { parts: [{ text: "Ok" }] } }],
        })
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      await provider.complete({
        messages: [
          { role: "system", content: "You are Gemini" },
          { role: "user", content: "hi" },
        ],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.systemInstruction).toEqual({
        parts: [{ text: "You are Gemini" }],
      });
      expect(body.contents).toEqual([{ role: "user", parts: [{ text: "hi" }] }]);
    });

    it("uses default model when none configured", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [{ content: { parts: [{ text: "Ok" }] } }],
        })
      );

      const provider = new GeminiProvider({ model: "", apiKey: "AIza-test" });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(mockFetch.mock.calls[0][0]).toContain("gemini-2.0-flash");
    });

    it("passes generationConfig from request", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [{ content: { parts: [{ text: "Ok" }] } }],
        })
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.3,
        maxTokens: 100,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.generationConfig.temperature).toBe(0.3);
      expect(body.generationConfig.maxOutputTokens).toBe(100);
    });

    it("returns empty string when no candidates or parts", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(mockJsonResponse({}));

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(result.content).toBe("");
    });

    it("throws on HTTP error", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(mockErrorResponse(403, "Forbidden"));

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "bad-key",
      });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("Gemini API error: 403 - Forbidden");
    });

    it("throws when no API key", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      const provider = new GeminiProvider({ model: "gemini-2.0-flash" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for Google Gemini");
    });

    it("handles missing system message gracefully", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          candidates: [{ content: { parts: [{ text: "Ok" }] } }],
        })
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.systemInstruction).toBeUndefined();
    });
  });

  describe("completeStream", () => {
    it("yields text from SSE chunks", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Hello\"}]}}]}\n",
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\" world\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("hits stream endpoint", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Ok\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }

      expect(mockFetch.mock.calls[0][0]).toContain("streamGenerateContent");
    });

    it("includes system instruction in stream", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Ok\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [
          { role: "system", content: "Be concise" },
          { role: "user", content: "hi" },
        ],
      })) {
        chunks.push(chunk);
      }

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.systemInstruction).toEqual({
        parts: [{ text: "Be concise" }],
      });
    });

    it("skips empty lines and non-data lines", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "\n",
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"A\"}]}}]}\n",
          " \n",
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"B\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A", "B"]);
    });

    it("skips malformed JSON chunks", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: not-json\n",
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"A\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("skips chunks with no text in parts", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"candidates\":[{\"content\":{\"parts\":[{}]}}]}\n",
          "data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"A\"}]}}]}\n",
        ])
      );

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("throws on HTTP error", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue(mockErrorResponse(429, "Rate limited"));

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("Gemini stream error: 429 - Rate limited");
    });

    it("throws when no response body", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      mockFetch.mockResolvedValue({ ok: true });

      const provider = new GeminiProvider({
        model: "gemini-2.0-flash",
        apiKey: "AIza-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("No response body");
    });

    it("throws when no API key", async () => {
      const { GeminiProvider } = await import("../ai/providers/gemini");
      const provider = new GeminiProvider({ model: "gemini-2.0-flash" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("API key not configured for Google Gemini");
    });
  });
});

describe("GroqProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns Groq", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      expect(provider.name).toBe("Groq");
    });
  });

  describe("constructor", () => {
    it("forces baseUrl to Groq endpoint", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      expect(provider["config"].baseUrl).toBe("https://api.groq.com/openai/v1");
    });
  });

  describe("complete", () => {
    it("sends request to Groq baseUrl", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [
            { message: { content: "Hello" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        })
      );

      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.groq.com/openai/v1/chat/completions",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer gsk-test",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("throws on HTTP error", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      mockFetch.mockResolvedValue(mockErrorResponse(400, "Bad request"));

      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("OpenAI API error: 400 - Bad request");
    });

    it("throws when no API key", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      const provider = new GroqProvider({ model: "llama3-70b" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for Groq");
    });
  });

  describe("completeStream", () => {
    it("yields content from SSE on Groq endpoint", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello"]);
    });

    it("throws on HTTP error", async () => {
      const { GroqProvider } = await import("../ai/providers/groq");
      mockFetch.mockResolvedValue(mockErrorResponse(429, "Rate limited"));

      const provider = new GroqProvider({
        model: "llama3-70b",
        apiKey: "gsk-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("OpenAI stream error: 429 - Rate limited");
    });
  });
});

describe("OllamaProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns Ollama", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      const provider = new OllamaProvider({ model: "llama3.2" });
      expect(provider.name).toBe("Ollama");
    });
  });

  describe("constructor", () => {
    it("sets default baseUrl, temperature, maxTokens, and model fallback", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      const provider = new OllamaProvider({ model: "" });
      expect(provider["config"].baseUrl).toBe("http://localhost:11434");
      expect(provider["config"].temperature).toBe(0.7);
      expect(provider["config"].maxTokens).toBe(4000);
      expect(provider["config"].model).toBe("llama3.2");
    });

    it("uses provided model", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      const provider = new OllamaProvider({ model: "mistral" });
      expect(provider["config"].model).toBe("mistral");
    });

    it("does not require apiKey", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      const provider = new OllamaProvider({ model: "llama3.2" });
      expect(provider["config"].apiKey).toBeUndefined();
    });
  });

  describe("complete", () => {
    it("sends request to /api/chat and returns response", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          message: { content: "Hello from Ollama" },
          done: true,
          prompt_eval_count: 10,
          eval_count: 20,
        })
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:11434/api/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining('"model":"llama3.2"'),
        })
      );
      expect(result).toEqual({
        content: "Hello from Ollama",
        finishReason: "stop",
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      });
    });

    it("returns undefined finishReason when not done", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          message: { content: "partial" },
          done: false,
        })
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(result.finishReason).toBeUndefined();
      expect(result.content).toBe("partial");
    });

    it("returns empty content when no message", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(mockJsonResponse({ done: true }));

      const provider = new OllamaProvider({ model: "llama3.2" });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });
      expect(result.content).toBe("");
    });

    it("buildMessages prepends system message", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          message: { content: "Ok" },
          done: true,
        })
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    });

    it("uses request temperature and maxTokens", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          message: { content: "Ok" },
          done: true,
        })
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.1,
        maxTokens: 50,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.options.temperature).toBe(0.1);
      expect(body.options.num_predict).toBe(50);
    });

    it("sets stream: false in body", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          message: { content: "Ok" },
          done: true,
        })
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      await provider.complete({ messages: [{ role: "user", content: "hi" }] });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(false);
    });

    it("throws on HTTP error", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(mockErrorResponse(500, "Internal error"));

      const provider = new OllamaProvider({ model: "llama3.2" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("Ollama API error: 500 - Internal error");
    });
  });

  describe("completeStream", () => {
    it("yields content from newline-delimited JSON stream", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "{\"message\":{\"content\":\"Hello\"}}\n",
          "{\"message\":{\"content\":\" world\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("sets stream: true in body", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "{\"message\":{\"content\":\"Ok\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.stream).toBe(true);
    });

    it("skips empty lines", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "\n",
          "{\"message\":{\"content\":\"A\"}}\n",
          "\n",
          "{\"message\":{\"content\":\"B\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A", "B"]);
    });

    it("skips lines without message.content", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "{\"done\":true}\n",
          "{\"message\":{\"content\":\"A\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("skips malformed JSON lines", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "not-json\n",
          "{\"message\":{\"content\":\"A\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("handles multi-line chunks split across reads", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "{\"message\":{\"content\":\"He",
          "llo\"}}\n{\"message\":{\"content\":\" world\"}}\n",
        ])
      );

      const provider = new OllamaProvider({ model: "llama3.2" });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello", " world"]);
    });

    it("throws on HTTP error", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue(mockErrorResponse(500, "Ollama error"));

      const provider = new OllamaProvider({ model: "llama3.2" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("Ollama stream error: 500 - Ollama error");
    });

    it("throws when no response body", async () => {
      const { OllamaProvider } = await import("../ai/providers/ollama");
      mockFetch.mockResolvedValue({ ok: true });

      const provider = new OllamaProvider({ model: "llama3.2" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("No response body");
    });
  });
});

describe("LMStudioProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns LM Studio", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");
      const provider = new LMStudioProvider({ model: "local-model" });
      expect(provider.name).toBe("LM Studio");
    });
  });

  describe("constructor", () => {
    it("sets baseUrl, model default, temperature, and maxTokens", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");
      const provider = new LMStudioProvider({ model: "" });
      expect(provider["config"].baseUrl).toBe("http://localhost:1234/v1");
      expect(provider["config"].model).toBe("local-model");
      expect(provider["config"].temperature).toBe(0.7);
      expect(provider["config"].maxTokens).toBe(4000);
    });

    it("uses provided model", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");
      const provider = new LMStudioProvider({ model: "my-model" });
      expect(provider["config"].model).toBe("my-model");
    });

    it("does not have apiKey in config", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");
      const provider = new LMStudioProvider({ model: "local-model" });
      expect(provider["config"].apiKey).toBeUndefined();
    });
  });

  describe("complete", () => {
    it("throws API key error because LM Studio inherits OpenAI complete which requires apiKey", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");

      const provider = new LMStudioProvider({ model: "local-model" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for LM Studio");
    });
  });

  describe("completeStream", () => {
    it("throws API key error because LM Studio inherits OpenAI completeStream which requires apiKey", async () => {
      const { LMStudioProvider } = await import("../ai/providers/lmstudio");

      const provider = new LMStudioProvider({ model: "local-model" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("API key not configured for LM Studio");
    });
  });
});

describe("OpenRouterProvider", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("name", () => {
    it("returns OpenRouter", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      expect(provider.name).toBe("OpenRouter");
    });
  });

  describe("constructor", () => {
    it("forces baseUrl to OpenRouter endpoint", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      expect(provider["config"].baseUrl).toBe("https://openrouter.ai/api/v1");
    });
  });

  describe("complete", () => {
    it("sends request with custom headers", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [
            { message: { content: "Hello" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
        })
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const result = await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-or-test",
            "HTTP-Referer": "https://emmettanthony.dev",
            "X-Title": "Emmett Anthony Chatbot",
          },
        })
      );
      expect(result).toEqual({
        content: "Hello",
        finishReason: "stop",
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 },
      });
    });

    it("throws on HTTP error", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(mockErrorResponse(401, "Unauthorized"));

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "bad-key",
      });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("OpenRouter API error: 401 - Unauthorized");
    });

    it("uses request temperature and maxTokens", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [
            { message: { content: "Ok" }, finish_reason: "stop" },
          ],
        })
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
        temperature: 0.2,
        maxTokens: 500,
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(500);
    });

    it("buildMessages prepends system message", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          choices: [
            { message: { content: "Ok" }, finish_reason: "stop" },
          ],
        })
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      await provider.complete({
        messages: [{ role: "user", content: "hi" }],
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.messages).toEqual([{ role: "user", content: "hi" }]);
    });

    it("throws when no API key", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      const provider = new OpenRouterProvider({ model: "gpt-4" });
      await expect(
        provider.complete({ messages: [{ role: "user", content: "hi" }] })
      ).rejects.toThrow("API key not configured for OpenRouter");
    });
  });

  describe("completeStream", () => {
    it("yields content with custom headers", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}\n",
          "data: [DONE]\n",
        ])
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["Hello"]);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://openrouter.ai/api/v1/chat/completions",
        expect.objectContaining({
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer sk-or-test",
            "HTTP-Referer": "https://emmettanthony.dev",
            "X-Title": "Emmett Anthony Chatbot",
          },
        })
      );
    });

    it("handles SSE parsing edge cases", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n",
          " \n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"B\"}}]}\n",
        ])
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A", "B"]);
    });

    it("skips malformed JSON", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(
        mockStreamResponse([
          "data: not-json\n",
          "data: {\"choices\":[{\"delta\":{\"content\":\"A\"}}]}\n",
        ])
      );

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const chunks: string[] = [];
      for await (const chunk of provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      })) {
        chunks.push(chunk);
      }
      expect(chunks).toEqual(["A"]);
    });

    it("throws on HTTP error", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue(mockErrorResponse(429, "Rate limited"));

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("OpenRouter stream error: 429 - Rate limited");
    });

    it("throws when no response body", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      mockFetch.mockResolvedValue({ ok: true });

      const provider = new OpenRouterProvider({
        model: "gpt-4",
        apiKey: "sk-or-test",
      });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("No response body");
    });

    it("throws when no API key", async () => {
      const { OpenRouterProvider } = await import("../ai/providers/openrouter");
      const provider = new OpenRouterProvider({ model: "gpt-4" });
      const gen = provider.completeStream({
        messages: [{ role: "user", content: "hi" }],
      });
      await expect(gen.next()).rejects.toThrow("API key not configured for OpenRouter");
    });
  });
});
