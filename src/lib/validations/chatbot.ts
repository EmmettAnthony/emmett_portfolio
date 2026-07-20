import { z } from "zod";

const supportedProviders = [
  "openai", "anthropic", "gemini", "openrouter", "ollama", "lmstudio", "groq",
] as const;

const messageRoles = ["user", "assistant", "system"] as const;
const widgetPositions = ["left", "right"] as const;
const widgetSizes = ["sm", "md", "lg"] as const;

// ─── Chat Completion ──────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  role: z.enum(messageRoles),
  content: z.string().min(1, "Message cannot be empty").max(10000),
});

export const chatCompletionSchema = z.object({
  messages: z.array(chatMessageSchema).min(1, "At least one message is required"),
  conversationId: z.string().nullish(),
  stream: z.boolean().optional(),
  triggeredBy: z.string().nullish(),
});

// ─── Knowledge Base ───────────────────────────────────────────────────────
export const knowledgeBaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  content: z.string().min(1, "Content is required"),
  categoryId: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().max(200).nullable().optional(),
  sourceUrl: z.string().url().nullable().optional().or(z.literal("")),
  enabled: z.boolean().default(true),
});

export const knowledgeBaseUpdateSchema = knowledgeBaseSchema.partial();

export const knowledgeCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
  order: z.number().int().default(0),
});

export const knowledgeCategoryUpdateSchema = knowledgeCategorySchema.partial();

// ─── Prompt Templates ─────────────────────────────────────────────────────
export const promptTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  label: z.string().min(1, "Label is required").max(200),
  description: z.string().max(500).nullable().optional(),
  prompt: z.string().min(1, "Prompt is required"),
  category: z.string().min(1, "Category is required"),
  variables: z.array(z.string()).default([]),
  isSystem: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

export const promptTemplateUpdateSchema = promptTemplateSchema.partial();

// ─── Chat Settings ────────────────────────────────────────────────────────
export const chatSettingsSchema = z.object({
  provider: z.enum(supportedProviders).default("openai"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(100).max(16000).default(4000),
  systemPrompt: z.string().default(""),
  welcomeMessage: z.string().default("Hi! I'm Emmett's AI assistant. How can I help you today?"),
  suggestedQuestions: z.array(z.string()).default([]),
  blockedWords: z.array(z.string()).default([]),
  rateLimitPerMinute: z.number().int().min(1).max(100).default(10),
  rateLimitPerDay: z.number().int().min(1).max(10000).default(500),
  maxConversationLength: z.number().int().min(1).max(500).default(100),
  enableFileSearch: z.boolean().default(true),
  enableLeadCapture: z.boolean().default(true),
  enableBooking: z.boolean().default(true),
  enableHumanHandoff: z.boolean().default(true),
  enableMultilingual: z.boolean().default(true),
  enableAnalytics: z.boolean().default(true),
  enableWelcomeTrigger: z.boolean().default(true),
  welcomeDelayMs: z.number().int().min(1000).max(120000).default(15000),
  enableExitIntent: z.boolean().default(true),
  exitIntentMessage: z.string().default("👋 Before you go! I'd love to help with your next project. Whether you need a website, web app, CRM, or just have a question — I'm here to chat. What's on your mind?"),
  widgetPosition: z.enum(widgetPositions).default("right"),
  widgetColor: z.string().default("#2563eb"),
  widgetTitle: z.string().default("Chat with Emmett"),
  widgetSubtitle: z.string().default("AI Assistant"),
  widgetAvatar: z.string().nullable().optional(),
  widgetSize: z.enum(widgetSizes).default("md"),
  enabled: z.boolean().default(true),
});

export const chatSettingsUpdateSchema = chatSettingsSchema.partial();

// ─── Lead Capture ─────────────────────────────────────────────────────────
export const chatLeadSchema = z.object({
  conversationId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email"),
  phone: z.string().max(30).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  budget: z.string().max(100).nullable().optional(),
  timeline: z.string().max(100).nullable().optional(),
  requirements: z.string().min(1, "Requirements are required"),
  projectType: z.string().max(100).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  preferredContact: z.string().max(50).nullable().optional(),
});

// ─── Chat Feedback ────────────────────────────────────────────────────────
export const chatFeedbackSchema = z.object({
  conversationId: z.string().min(1),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
});

// ─── Rate Limit ───────────────────────────────────────────────────────────
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  limit: z.number().int().positive(),
  window: z.number().int().positive(), // in seconds
});

// ─── Types ────────────────────────────────────────────────────────────────
export type ChatMessageInput = z.input<typeof chatMessageSchema>;
export type ChatCompletionInput = z.input<typeof chatCompletionSchema>;
export type KnowledgeBaseInput = z.input<typeof knowledgeBaseSchema>;
export type KnowledgeBaseUpdateInput = z.input<typeof knowledgeBaseUpdateSchema>;
export type KnowledgeCategoryInput = z.input<typeof knowledgeCategorySchema>;
export type KnowledgeCategoryUpdateInput = z.input<typeof knowledgeCategoryUpdateSchema>;
export type PromptTemplateInput = z.input<typeof promptTemplateSchema>;
export type PromptTemplateUpdateInput = z.input<typeof promptTemplateUpdateSchema>;
export type ChatSettingsInput = z.input<typeof chatSettingsSchema>;
export type ChatSettingsUpdateInput = z.input<typeof chatSettingsUpdateSchema>;
export type ChatLeadInput = z.input<typeof chatLeadSchema>;
export type ChatFeedbackInput = z.input<typeof chatFeedbackSchema>;

