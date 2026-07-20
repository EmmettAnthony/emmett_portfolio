import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockConstructors: Record<string, ReturnType<typeof vi.fn>> = {};

function createMockProvider(name: string) {
  const ctor = vi.fn(function (config: unknown) {
    this.name = name;
    this.config = config;
  });
  mockConstructors[name] = ctor;
  return ctor;
}

vi.mock("../ai/providers/openai", () => ({
  OpenAIProvider: createMockProvider("openai"),
}));

vi.mock("../ai/providers/anthropic", () => ({
  AnthropicProvider: createMockProvider("anthropic"),
}));

vi.mock("../ai/providers/gemini", () => ({
  GeminiProvider: createMockProvider("gemini"),
}));

vi.mock("../ai/providers/openrouter", () => ({
  OpenRouterProvider: createMockProvider("openrouter"),
}));

vi.mock("../ai/providers/ollama", () => ({
  OllamaProvider: createMockProvider("ollama"),
}));

vi.mock("../ai/providers/lmstudio", () => ({
  LMStudioProvider: createMockProvider("lmstudio"),
}));

vi.mock("../ai/providers/groq", () => ({
  GroqProvider: createMockProvider("groq"),
}));

vi.mock("../ai/providers/base", () => ({
  BaseAIProvider: vi.fn(function (config: unknown) {
    this.config = config;
  }),
  AIProviderConfig: {},
}));

describe("ai/index", () => {
  let OLD_ENV: NodeJS.ProcessEnv;

  beforeEach(() => {
    OLD_ENV = process.env;
    process.env = { ...OLD_ENV };
    for (const key of Object.keys(mockConstructors)) {
      mockConstructors[key].mockClear();
    }
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  describe("createProvider", () => {
    it("creates an OpenAI provider with env API key", async () => {
      process.env.OPENAI_API_KEY = "sk-openai-test";
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("openai");
      expect(mockConstructors.openai).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "sk-openai-test",
        model: "gpt-4o-mini",
        temperature: 0.7,
        maxTokens: 4000,
      }));
      expect(provider.name).toBe("openai");
    });

    it("creates an Anthropic provider with env API key", async () => {
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("anthropic");
      expect(mockConstructors.anthropic).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "sk-ant-test",
        model: "claude-3-haiku-20240307",
      }));
      expect(provider.name).toBe("anthropic");
    });

    it("creates a Gemini provider with env API key", async () => {
      process.env.GEMINI_API_KEY = "gemini-key";
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("gemini");
      expect(mockConstructors.gemini).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "gemini-key",
        model: "gemini-2.0-flash",
      }));
      expect(provider.name).toBe("gemini");
    });

    it("creates an OpenRouter provider with env API key", async () => {
      process.env.OPENROUTER_API_KEY = "or-key";
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("openrouter");
      expect(mockConstructors.openrouter).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "or-key",
        model: "openai/gpt-4o-mini",
      }));
      expect(provider.name).toBe("openrouter");
    });

    it("creates an Ollama provider without API key", async () => {
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("ollama");
      expect(mockConstructors.ollama).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: undefined,
        model: "llama3.2",
      }));
      expect(provider.name).toBe("ollama");
    });

    it("creates an LM Studio provider without API key", async () => {
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("lmstudio");
      expect(mockConstructors.lmstudio).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: undefined,
        model: "local-model",
      }));
      expect(provider.name).toBe("lmstudio");
    });

    it("creates a Groq provider with env API key", async () => {
      process.env.GROQ_API_KEY = "gsk-test";
      const { createProvider } = await import("../ai/index");
      const provider = createProvider("groq");
      expect(mockConstructors.groq).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "gsk-test",
        model: "llama-3.3-70b-versatile",
      }));
      expect(provider.name).toBe("groq");
    });

    it("uses config apiKey over env var", async () => {
      process.env.OPENAI_API_KEY = "env-key";
      const { createProvider } = await import("../ai/index");
      createProvider("openai", { apiKey: "config-key" });
      expect(mockConstructors.openai).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "config-key",
      }));
    });

    it("uses config apiKey when no env key exists", async () => {
      const { createProvider } = await import("../ai/index");
      createProvider("openai", { apiKey: "direct-key" });
      expect(mockConstructors.openai).toHaveBeenCalledWith(expect.objectContaining({
        apiKey: "direct-key",
      }));
    });

    it("passes custom model, temperature, maxTokens", async () => {
      process.env.OPENAI_API_KEY = "sk-test";
      const { createProvider } = await import("../ai/index");
      createProvider("openai", {
        model: "gpt-4",
        temperature: 0.1,
        maxTokens: 2000,
      });
      expect(mockConstructors.openai).toHaveBeenCalledWith(expect.objectContaining({
        model: "gpt-4",
        temperature: 0.1,
        maxTokens: 2000,
        apiKey: "sk-test",
      }));
    });

    it("passes baseUrl when provided", async () => {
      process.env.OPENAI_API_KEY = "sk-test";
      const { createProvider } = await import("../ai/index");
      createProvider("openai", { baseUrl: "https://custom.ai/v1" });
      expect(mockConstructors.openai).toHaveBeenCalledWith(expect.objectContaining({
        baseUrl: "https://custom.ai/v1",
      }));
    });

    it("does not include baseUrl in config when not provided", async () => {
      process.env.OPENAI_API_KEY = "sk-test";
      const { createProvider } = await import("../ai/index");
      createProvider("openai", {});
      const callArg = mockConstructors.openai.mock.calls[0][0];
      expect(callArg.baseUrl).toBeUndefined();
    });

    it("throws for unknown provider type", async () => {
      const { createProvider } = await import("../ai/index");
      expect(() => createProvider("unknown" as any)).toThrow("Unknown AI provider: unknown");
    });
  });

  describe("getDefaultModel", () => {
    it("returns default model for openai", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("openai")).toBe("gpt-4o-mini");
    });

    it("returns default model for anthropic", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("anthropic")).toBe("claude-3-haiku-20240307");
    });

    it("returns default model for gemini", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("gemini")).toBe("gemini-2.0-flash");
    });

    it("returns default model for openrouter", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("openrouter")).toBe("openai/gpt-4o-mini");
    });

    it("returns default model for ollama", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("ollama")).toBe("llama3.2");
    });

    it("returns default model for lmstudio", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("lmstudio")).toBe("local-model");
    });

    it("returns default model for groq", async () => {
      const { getDefaultModel } = await import("../ai/index");
      expect(getDefaultModel("groq")).toBe("llama-3.3-70b-versatile");
    });
  });

  describe("BaseAIProvider re-export", () => {
    it("exports BaseAIProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.BaseAIProvider).toBeDefined();
    });
  });

  describe("provider re-exports", () => {
    it("re-exports OpenAIProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.OpenAIProvider).toBeDefined();
    });

    it("re-exports AnthropicProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.AnthropicProvider).toBeDefined();
    });

    it("re-exports GeminiProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.GeminiProvider).toBeDefined();
    });

    it("re-exports OpenRouterProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.OpenRouterProvider).toBeDefined();
    });

    it("re-exports OllamaProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.OllamaProvider).toBeDefined();
    });

    it("re-exports LMStudioProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.LMStudioProvider).toBeDefined();
    });

    it("re-exports GroqProvider", async () => {
      const mod = await import("../ai/index");
      expect(mod.GroqProvider).toBeDefined();
    });
  });
});
