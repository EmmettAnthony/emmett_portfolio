// ─── AI Providers ─────────────────────────────────────────────────────────
export type AIProviderType = "openai" | "anthropic" | "gemini" | "openrouter" | "ollama" | "lmstudio" | "groq";

export const AI_PROVIDERS: AIProviderType[] = [
  "openai", "anthropic", "gemini", "openrouter", "ollama", "lmstudio", "groq",
];

export const AI_PROVIDER_LABELS: Record<AIProviderType, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  ollama: "Ollama (Local)",
  lmstudio: "LM Studio (Local)",
  groq: "Groq",
};

// ─── Message Roles ────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant" | "system";

// ─── Chat Message ─────────────────────────────────────────────────────────
export interface ChatMessageData {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

// ─── Chat Conversation ────────────────────────────────────────────────────
export type ConversationStatus = "ACTIVE" | "WAITING" | "RESOLVED" | "ARCHIVED" | "ESCALATED";
export type ConversationSource = "chat_widget" | "chat_page" | "api" | "whatsapp" | "email";

export interface ChatConversationData {
  id: string;
  visitorId: string | null;
  visitorName: string | null;
  visitorEmail: string | null;
  status: ConversationStatus;
  source: ConversationSource;
  language: string;
  metadata: Record<string, unknown> | null;
  messageCount: number;
  leadId: string | null;
  feedbackScore: number | null;
  isHighPriority: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  messages?: ChatMessageData[];
}

// ─── Knowledge Base ───────────────────────────────────────────────────────
export interface KnowledgeBaseData {
  id: string;
  title: string;
  content: string;
  categoryId: string | null;
  category?: KnowledgeCategoryData | null;
  tags: string[];
  source: string | null;
  sourceUrl: string | null;
  embedding: number[] | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  order: number;
  items?: KnowledgeBaseData[];
  createdAt: string;
  updatedAt: string;
}

// ─── Prompt Templates ─────────────────────────────────────────────────────
export interface PromptTemplateData {
  id: string;
  name: string;
  label: string;
  description: string | null;
  prompt: string;
  category: string;
  variables: string[];
  isSystem: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Lead ────────────────────────────────────────────────────────────
export type LeadStatus = "NEW" | "QUALIFIED" | "CONTACTED" | "CONVERTED" | "DISMISSED";

export interface ChatLeadData {
  id: string;
  conversationId: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  budget: string | null;
  timeline: string | null;
  requirements: string;
  projectType: string | null;
  industry: string | null;
  preferredContact: string | null;
  leadScore: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Settings ────────────────────────────────────────────────────────
export interface ChatSettingsData {
  id: string;
  provider: AIProviderType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  welcomeMessage: string;
  suggestedQuestions: string[];
  blockedWords: string[];
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  maxConversationLength: number;
  enableFileSearch: boolean;
  enableLeadCapture: boolean;
  enableBooking: boolean;
  enableHumanHandoff: boolean;
  enableMultilingual: boolean;
  enableAnalytics: boolean;
  enableWelcomeTrigger: boolean;
  welcomeDelayMs: number;
  enableExitIntent: boolean;
  widgetPosition: "left" | "right";
  widgetColor: string;
  widgetTitle: string;
  widgetSubtitle: string;
  widgetAvatar: string | null;
  widgetSize: "sm" | "md" | "lg";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Chat Analytics ───────────────────────────────────────────────────────
export interface ChatAnalyticsData {
  id: string;
  date: string;
  totalConversations: number;
  totalMessages: number;
  leadsGenerated: number;
  bookingsMade: number;
  questionsAsked: number;
  resolvedCount: number;
  escalatedCount: number;
  avgResponseTime: number;
  avgSessionDuration: number;
  satisfactionScore: number;
  popularTopics: Record<string, number>;
  topQuestions: { question: string; count: number }[];
  providerUsage: Record<string, number>;
  createdAt: string;
}

// ─── Chat Feedback ────────────────────────────────────────────────────────
export interface ChatFeedbackData {
  id: string;
  conversationId: string;
  score: number;
  comment: string | null;
  category: string | null;
  createdAt: string;
}

// ─── API Response Types ───────────────────────────────────────────────────
export interface ChatCompletionRequest {
  messages: { role: MessageRole; content: string }[];
  conversationId?: string;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  message: string;
  conversationId: string;
  leadCaptured?: boolean;
  bookingSuggested?: boolean;
  actions?: string[];
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  score: number;
  source: string | null;
  sourceUrl: string | null;
}

export interface ChatAnalyticsSummary {
  totalConversations: number;
  todayConversations: number;
  activeConversations: number;
  totalLeads: number;
  todayLeads: number;
  totalBookings: number;
  avgSatisfaction: number;
  conversionRate: number;
  topTopics: { topic: string; count: number }[];
  conversationsOverTime: { date: string; count: number }[];
  leadsOverTime: { date: string; count: number }[];
  providerBreakdown: { provider: string; count: number }[];
  recentFeedback: ChatFeedbackData[];
}

