import { describe, it, expect } from "vitest";
import {
  chatMessageSchema,
  chatCompletionSchema,
  knowledgeBaseSchema,
  knowledgeBaseUpdateSchema,
  knowledgeCategorySchema,
  knowledgeCategoryUpdateSchema,
  promptTemplateSchema,
  promptTemplateUpdateSchema,
  chatSettingsSchema,
  chatSettingsUpdateSchema,
  chatLeadSchema,
  chatFeedbackSchema,
  rateLimitSchema,
} from "../validations/chatbot";

describe("chatMessageSchema", () => {
  it("parses valid message", () => {
    const result = chatMessageSchema.parse({
      role: "user",
      content: "Hello",
    });
    expect(result.role).toBe("user");
    expect(result.content).toBe("Hello");
  });

  it("rejects empty content", () => {
    const result = chatMessageSchema.safeParse({
      role: "user",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects content over 10000 chars", () => {
    const result = chatMessageSchema.safeParse({
      role: "user",
      content: "C".repeat(10001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = chatMessageSchema.safeParse({
      role: "admin",
      content: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid roles", () => {
    const roles = ["user", "assistant", "system"] as const;
    for (const role of roles) {
      const result = chatMessageSchema.parse({ role, content: "Test" });
      expect(result.role).toBe(role);
    }
  });
});

describe("chatCompletionSchema", () => {
  it("parses valid completion", () => {
    const result = chatCompletionSchema.parse({
      messages: [{ role: "user", content: "Hello" }],
    });
    expect(result.messages).toHaveLength(1);
  });

  it("rejects empty messages", () => {
    const result = chatCompletionSchema.safeParse({
      messages: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional stream and triggeredBy", () => {
    const result = chatCompletionSchema.parse({
      messages: [{ role: "user", content: "Hello" }],
      conversationId: "conv_1",
      stream: true,
      triggeredBy: "user_1",
    });
    expect(result.conversationId).toBe("conv_1");
    expect(result.stream).toBe(true);
    expect(result.triggeredBy).toBe("user_1");
  });
});

describe("knowledgeBaseSchema", () => {
  it("parses valid entry", () => {
    const result = knowledgeBaseSchema.parse({
      title: "FAQ",
      content: "Some content",
    });
    expect(result.title).toBe("FAQ");
    expect(result.content).toBe("Some content");
    expect(result.tags).toEqual([]);
    expect(result.enabled).toBe(true);
  });

  it("rejects empty title", () => {
    const result = knowledgeBaseSchema.safeParse({
      title: "",
      content: "Content",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty content", () => {
    const result = knowledgeBaseSchema.safeParse({
      title: "FAQ",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = knowledgeBaseSchema.parse({
      title: "FAQ",
      content: "Content",
      categoryId: "cat_1",
      tags: ["tag1"],
      source: "docs",
      sourceUrl: "https://example.com",
      enabled: false,
    });
    expect(result.categoryId).toBe("cat_1");
    expect(result.tags).toEqual(["tag1"]);
    expect(result.sourceUrl).toBe("https://example.com");
    expect(result.enabled).toBe(false);
  });

  it("accepts empty string for sourceUrl", () => {
    const result = knowledgeBaseSchema.parse({
      title: "FAQ",
      content: "Content",
      sourceUrl: "",
    });
    expect(result.sourceUrl).toBe("");
  });

  it("rejects invalid sourceUrl", () => {
    const result = knowledgeBaseSchema.safeParse({
      title: "FAQ",
      content: "Content",
      sourceUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("knowledgeBaseUpdateSchema", () => {
  it("parses empty object", () => {
    const result = knowledgeBaseUpdateSchema.parse({});
    expect(result).toEqual({
      enabled: true,
      tags: [],
    });
  });
});

describe("knowledgeCategorySchema", () => {
  it("parses valid category", () => {
    const result = knowledgeCategorySchema.parse({
      name: "General",
      slug: "general",
    });
    expect(result.name).toBe("General");
    expect(result.slug).toBe("general");
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = knowledgeCategorySchema.safeParse({
      name: "",
      slug: "general",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = knowledgeCategorySchema.safeParse({
      name: "General",
      slug: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = knowledgeCategorySchema.parse({
      name: "General",
      slug: "general",
      description: "General category",
      icon: "folder",
      color: "blue",
      order: 1,
    });
    expect(result.description).toBe("General category");
    expect(result.icon).toBe("folder");
    expect(result.color).toBe("blue");
    expect(result.order).toBe(1);
  });
});

describe("knowledgeCategoryUpdateSchema", () => {
  it("parses empty object", () => {
    const result = knowledgeCategoryUpdateSchema.parse({});
    expect(result).toEqual({
      order: 0,
    });
  });
});

describe("promptTemplateSchema", () => {
  it("parses valid template", () => {
    const result = promptTemplateSchema.parse({
      name: "Greeting",
      label: "Greeting Prompt",
      prompt: "Say hello",
      category: "general",
    });
    expect(result.name).toBe("Greeting");
    expect(result.label).toBe("Greeting Prompt");
    expect(result.prompt).toBe("Say hello");
    expect(result.category).toBe("general");
    expect(result.variables).toEqual([]);
    expect(result.isSystem).toBe(false);
    expect(result.enabled).toBe(true);
  });

  it("rejects empty name", () => {
    const result = promptTemplateSchema.safeParse({
      name: "",
      label: "Greeting",
      prompt: "Hello",
      category: "general",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty label", () => {
    const result = promptTemplateSchema.safeParse({
      name: "Test",
      label: "",
      prompt: "Hello",
      category: "general",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty prompt", () => {
    const result = promptTemplateSchema.safeParse({
      name: "Test",
      label: "Test",
      prompt: "",
      category: "general",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = promptTemplateSchema.safeParse({
      name: "Test",
      label: "Test",
      prompt: "Hello",
      category: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("promptTemplateUpdateSchema", () => {
  it("parses empty object", () => {
    const result = promptTemplateUpdateSchema.parse({});
    expect(result).toEqual({
      enabled: true,
      isSystem: false,
      variables: [],
    });
  });
});

describe("chatSettingsSchema", () => {
  it("parses with defaults", () => {
    const result = chatSettingsSchema.parse({
      model: "gpt-4",
    });
    expect(result.model).toBe("gpt-4");
    expect(result.provider).toBe("openai");
    expect(result.temperature).toBe(0.7);
    expect(result.maxTokens).toBe(4000);
    expect(result.systemPrompt).toBe("");
    expect(result.welcomeMessage).toBe("Hi! I'm Emmett's AI assistant. How can I help you today?");
    expect(result.suggestedQuestions).toEqual([]);
    expect(result.blockedWords).toEqual([]);
    expect(result.rateLimitPerMinute).toBe(10);
    expect(result.rateLimitPerDay).toBe(500);
    expect(result.maxConversationLength).toBe(100);
    expect(result.enableFileSearch).toBe(true);
    expect(result.enableLeadCapture).toBe(true);
    expect(result.enableBooking).toBe(true);
    expect(result.enableHumanHandoff).toBe(true);
    expect(result.enableMultilingual).toBe(true);
    expect(result.enableAnalytics).toBe(true);
    expect(result.enableWelcomeTrigger).toBe(true);
    expect(result.welcomeDelayMs).toBe(15000);
    expect(result.enableExitIntent).toBe(true);
    expect(result.widgetPosition).toBe("right");
    expect(result.widgetColor).toBe("#2563eb");
    expect(result.widgetTitle).toBe("Chat with Emmett");
    expect(result.widgetSubtitle).toBe("AI Assistant");
    expect(result.widgetSize).toBe("md");
    expect(result.enabled).toBe(true);
  });

  it("rejects empty model", () => {
    const result = chatSettingsSchema.safeParse({ model: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid provider", () => {
    const result = chatSettingsSchema.safeParse({
      provider: "invalid",
      model: "gpt-4",
    });
    expect(result.success).toBe(false);
  });

  it("rejects temperature below 0", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      temperature: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects temperature above 2", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      temperature: 2.1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxTokens below 100", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      maxTokens: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects maxTokens above 16000", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      maxTokens: 20000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rateLimitPerMinute below 1", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      rateLimitPerMinute: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects rateLimitPerMinute above 100", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      rateLimitPerMinute: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid widget position", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      widgetPosition: "top",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid widget size", () => {
    const result = chatSettingsSchema.safeParse({
      model: "gpt-4",
      widgetSize: "xl",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid providers", () => {
    const providers = ["openai", "anthropic", "gemini", "openrouter", "ollama", "lmstudio", "groq"] as const;
    for (const p of providers) {
      const result = chatSettingsSchema.parse({ model: "test", provider: p });
      expect(result.provider).toBe(p);
    }
  });
});

describe("chatSettingsUpdateSchema", () => {
  it("parses empty object", () => {
    const result = chatSettingsUpdateSchema.parse({});
    expect(result).toEqual({
      blockedWords: [],
      enableAnalytics: true,
      enableBooking: true,
      enableExitIntent: true,
      enableFileSearch: true,
      enableHumanHandoff: true,
      enableLeadCapture: true,
      enableMultilingual: true,
      enableWelcomeTrigger: true,
      enabled: true,
      exitIntentMessage: "👋 Before you go! I'd love to help with your next project. Whether you need a website, web app, CRM, or just have a question — I'm here to chat. What's on your mind?",
      maxConversationLength: 100,
      maxTokens: 4000,
      provider: "openai",
      rateLimitPerDay: 500,
      rateLimitPerMinute: 10,
      suggestedQuestions: [],
      systemPrompt: "",
      temperature: 0.7,
      welcomeDelayMs: 15000,
      welcomeMessage: "Hi! I'm Emmett's AI assistant. How can I help you today?",
      widgetColor: "#2563eb",
      widgetPosition: "right",
      widgetSize: "md",
      widgetSubtitle: "AI Assistant",
      widgetTitle: "Chat with Emmett",
    });
  });
});

describe("chatLeadSchema", () => {
  it("parses valid lead", () => {
    const result = chatLeadSchema.parse({
      conversationId: "conv_1",
      name: "John Doe",
      email: "john@example.com",
      requirements: "Need a website",
    });
    expect(result.conversationId).toBe("conv_1");
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.requirements).toBe("Need a website");
  });

  it("rejects empty conversationId", () => {
    const result = chatLeadSchema.safeParse({
      conversationId: "",
      name: "John",
      email: "john@example.com",
      requirements: "Need help",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = chatLeadSchema.safeParse({
      conversationId: "conv_1",
      name: "",
      email: "john@example.com",
      requirements: "Need help",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = chatLeadSchema.safeParse({
      conversationId: "conv_1",
      name: "John",
      email: "bad",
      requirements: "Need help",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty requirements", () => {
    const result = chatLeadSchema.safeParse({
      conversationId: "conv_1",
      name: "John",
      email: "john@example.com",
      requirements: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = chatLeadSchema.parse({
      conversationId: "conv_1",
      name: "John",
      email: "john@example.com",
      requirements: "Need help",
      phone: "+1234567890",
      company: "Acme",
      budget: "$5000",
      timeline: "1 month",
      projectType: "web",
      industry: "tech",
      preferredContact: "email",
    });
    expect(result.phone).toBe("+1234567890");
    expect(result.company).toBe("Acme");
    expect(result.budget).toBe("$5000");
    expect(result.timeline).toBe("1 month");
  });
});

describe("chatFeedbackSchema", () => {
  it("parses valid feedback", () => {
    const result = chatFeedbackSchema.parse({
      conversationId: "conv_1",
      score: 4,
    });
    expect(result.conversationId).toBe("conv_1");
    expect(result.score).toBe(4);
  });

  it("rejects empty conversationId", () => {
    const result = chatFeedbackSchema.safeParse({
      conversationId: "",
      score: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects score below 1", () => {
    const result = chatFeedbackSchema.safeParse({
      conversationId: "conv_1",
      score: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects score above 5", () => {
    const result = chatFeedbackSchema.safeParse({
      conversationId: "conv_1",
      score: 6,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer score", () => {
    const result = chatFeedbackSchema.safeParse({
      conversationId: "conv_1",
      score: 3.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = chatFeedbackSchema.parse({
      conversationId: "conv_1",
      score: 5,
      comment: "Great!",
      category: "positive",
    });
    expect(result.comment).toBe("Great!");
    expect(result.category).toBe("positive");
  });
});

describe("rateLimitSchema", () => {
  it("parses valid rate limit", () => {
    const result = rateLimitSchema.parse({
      identifier: "user_1",
      limit: 10,
      window: 60,
    });
    expect(result.identifier).toBe("user_1");
    expect(result.limit).toBe(10);
    expect(result.window).toBe(60);
  });

  it("rejects empty identifier", () => {
    const result = rateLimitSchema.safeParse({
      identifier: "",
      limit: 10,
      window: 60,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive limit", () => {
    const result = rateLimitSchema.safeParse({
      identifier: "user_1",
      limit: 0,
      window: 60,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive window", () => {
    const result = rateLimitSchema.safeParse({
      identifier: "user_1",
      limit: 10,
      window: -1,
    });
    expect(result.success).toBe(false);
  });
});
