import { NextRequest, NextResponse } from "next/server";
import { createProvider } from "@/lib/ai";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { searchAll } from "@/lib/ai/rag";
import { prisma } from "@/lib/db";
import { chatCompletionSchema } from "@/lib/validations/chatbot";
import { detectLeadIntent, detectLanguage } from "@/lib/chatbot/lead-detection";
import { captureLeadFromConversation } from "@/lib/chatbot/lead-capture";
import { trackChatMetric, trackConversationCreated, trackLeadGenerated } from "@/lib/chatbot/analytics";
import { sendEscalationEmail } from "@/lib/chatbot/escalation";
import { notifyChatEscalated } from "@/lib/notifications/event-handlers";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/security";
import type { AIProviderType } from "@/types/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AVAILABLE_PROVIDERS: { key: string; name: string; defaultModel: string }[] = [
  { key: "openai", name: "OPENAI_API_KEY", defaultModel: "gpt-4o-mini" },
  { key: "anthropic", name: "ANTHROPIC_API_KEY", defaultModel: "claude-3-haiku-20240307" },
  { key: "gemini", name: "GEMINI_API_KEY", defaultModel: "gemini-2.0-flash" },
  { key: "openrouter", name: "OPENROUTER_API_KEY", defaultModel: "openai/gpt-4o-mini" },
  { key: "groq", name: "GROQ_API_KEY", defaultModel: "llama3-70b-8192" },
];

function pickAvailableProvider(configured?: string): AIProviderType {
  if (configured) {
    const entry = AVAILABLE_PROVIDERS.find((p) => p.key === configured);
    if (entry && process.env[entry.name]) return configured as AIProviderType;
  }
  const fallback = AVAILABLE_PROVIDERS.find((p) => process.env[p.name]);
  return (fallback?.key || "openai") as AIProviderType;
}

export async function POST(request: NextRequest) {
  let knowledgeResults: { title: string; content: string }[] = [];
  let conversationId: string | null = null;

  try {
    const body = await request.json();
    const parsed = chatCompletionSchema.parse(body);

    const settings = await prisma.chatSettings.findFirst();
    if (settings && !settings.enabled) {
      return NextResponse.json(
        { error: "Chatbot is disabled", message: "Chat is currently unavailable." },
        { status: 503 }
      );
    }

    // Per-minute rate limit
    const rl = await checkRateLimit(request, "chat-completion", settings?.rateLimitPerMinute ?? 10, 60_000);
    if (!rl.passed) return rl.response;

    // Per-day rate limit (uses persistent key)
    if (settings?.rateLimitPerDay) {
      const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
      const dailyRl = await checkRateLimit(request, "chat-completion-daily:" + ip, settings.rateLimitPerDay, 86_400_000);
      if (!dailyRl.passed) return dailyRl.response;
    }

    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    // ── Blocked words check ──────────────────────────────────────────────
    const userMessage = parsed.messages[parsed.messages.length - 1];
    if (userMessage.role === "user" && settings?.blockedWords?.length) {
      const lowerMsg = userMessage.content.toLowerCase();
      const matchedBlocked = settings.blockedWords.find((word) =>
        lowerMsg.includes(word.toLowerCase())
      );
      if (matchedBlocked) {
        return NextResponse.json(
          { error: "Message contains blocked content", message: "Your message contains content that cannot be processed. Please rephrase." },
          { status: 400 }
        );
      }
    }

    // ── Create or load conversation ──────────────────────────────────────
    conversationId = parsed.conversationId ?? null;
    if (!conversationId) {
      const triggeredBy = parsed.triggeredBy;
      const metadata = triggeredBy ? { triggeredBy } : undefined;
      const conversation = await prisma.chatConversation.create({
        data: {
          source: "chat_widget",
          language: settings?.enableMultilingual !== false ? detectLanguage(userMessage.content || "") : "en",
          status: "ACTIVE",
          ...(metadata ? { metadata } : {}),
        },
      });
      conversationId = conversation.id;
      await trackConversationCreated();
    } else {
      const existing = await prisma.chatConversation.findUnique({ where: { id: conversationId } });
      if (!existing) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

      // Enforce max conversation length
      const maxLen = settings?.maxConversationLength ?? 100;
      if (existing.messageCount >= maxLen) {
        return NextResponse.json(
          { error: "Conversation limit reached", message: "This conversation has reached the maximum length. Please start a new one." },
          { status: 400 }
        );
      }

      if (settings?.enableMultilingual !== false) {
        const detectedLang = detectLanguage(userMessage.content || "");
        if (detectedLang !== existing.language) {
          await prisma.chatConversation.update({ where: { id: conversationId }, data: { language: detectedLang } });
        }
      }
    }

    // ── Save user message & update conversation ─────────────────────────
    if (userMessage.role === "user") {
      await prisma.chatMessage.create({ data: { conversationId, role: "user", content: userMessage.content } });
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { messageCount: { increment: 1 }, lastActivityAt: new Date() },
      });
    }

    // ── Human handoff detection ──────────────────────────────────────────
    const humanHandoffPattern = /\b(talk to human|speak to person|real person|human agent|real agent|transfer to|escalate|talk to a human|human support)\b/i;
    const wantsHumanHandoff = humanHandoffPattern.test(userMessage.content);

    if (wantsHumanHandoff && settings?.enableHumanHandoff) {
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { status: "ESCALATED" },
      });
      sendEscalationEmail(conversationId).catch((err) =>
        console.error("Escalation email failed:", err)
      );
      notifyChatEscalated(null, conversationId).catch(() => {});
    }

    // ── Lead detection (respected by enableLeadCapture toggle) ──────────
    const leadCaptureEnabled = settings?.enableLeadCapture !== false;
    const leadIntent = leadCaptureEnabled ? detectLeadIntent(userMessage.content) : { isLead: false, confidence: 0, suggestsBooking: false };

    // ── Knowledge base search ────────────────────────────────────────────
    knowledgeResults = await searchAll(userMessage.content);
    const knowledgeContext = knowledgeResults.length > 0
      ? "\n\n## RELEVANT INFORMATION\n" + knowledgeResults.map((r) => "**" + r.title + "**\n" + r.content.slice(0, 300)).join("\n\n")
      : "";

    const systemPrompt = await buildSystemPrompt();
    const fullSystemPrompt = systemPrompt + knowledgeContext;

    const aiMessages = [
      { role: "system" as const, content: fullSystemPrompt },
      ...parsed.messages.slice(0, -1).map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: userMessage.content },
    ];


    const providerTemp = settings?.temperature ?? 0.7;
    const providerMaxTokens = settings?.maxTokens ?? 4000;

    // Pick a provider that has an API key configured
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI provider type compat
    const configuredProvider = pickAvailableProvider(settings?.provider as any);

    if (parsed.stream) {
      const provider = createProvider(configuredProvider, {
        temperature: providerTemp,
        maxTokens: providerMaxTokens,
      });

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const streamConversationId = conversationId!;
          let fullResponse = "";
          try {
            for await (const chunk of provider.completeStream({
              messages: aiMessages,
              temperature: providerTemp,
              maxTokens: providerMaxTokens,
            })) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ content: chunk }) + "\n\n"));
            }

            let finalResponse = fullResponse;
            const bookingEnabled = settings?.enableBooking !== false;
            if (leadIntent.suggestsBooking && bookingEnabled) {
              const bookingUrl = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "https://calendar.app.google/45f7gXNps2jdx7AZ7";
              const bookingCta = `\n\n---\n💬 **Want to discuss this further?** [Book a free consultation call](${bookingUrl}) to talk through your project with Emmett directly.`;
              finalResponse += bookingCta;
              controller.enqueue(encoder.encode("data: " + JSON.stringify({ content: bookingCta }) + "\n\n"));
            }

            await prisma.chatMessage.create({
              data: { conversationId: streamConversationId, role: "assistant", content: finalResponse },
            });

            // Update conversation after assistant response
            await prisma.chatConversation.update({
              where: { id: streamConversationId },
              data: { messageCount: { increment: 1 }, lastActivityAt: new Date() },
            });

            if (leadIntent.isLead) {
              const lead = await captureLeadFromConversation(streamConversationId, userMessage.content, fullResponse);
              if (lead) {
                await trackLeadGenerated();
                controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "lead_captured", id: lead.id }) + "\n\n"));
              }
            }

            await trackChatMetric(streamConversationId);
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "done", conversationId: streamConversationId, humanHandoff: wantsHumanHandoff && !!(settings?.enableHumanHandoff), bookingSuggested: leadIntent.suggestsBooking && bookingEnabled }) + "\n\n"));
          } catch (_error) {
            if (fullResponse) {
              try {
                await prisma.chatMessage.create({
                  data: { conversationId: streamConversationId, role: "assistant", content: fullResponse },
                }).catch(() => {});
              } catch { /* non-critical */ }
            }
            try {
              await prisma.chatConversation.update({
                where: { id: streamConversationId },
                data: { lastActivityAt: new Date() },
              }).catch(() => {});
            } catch { /* non-critical */ }
            controller.enqueue(encoder.encode("data: " + JSON.stringify({ error: "AI provider error", message: "Sorry, I encountered an error." }) + "\n\n"));
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // ── Non-streaming path ───────────────────────────────────────────────
    const provider = createProvider(configuredProvider, {
      temperature: providerTemp,
      maxTokens: providerMaxTokens,
    });

    const completion = await provider.complete({
      messages: aiMessages,
      temperature: providerTemp,
      maxTokens: providerMaxTokens,
    });

    await prisma.chatMessage.create({ data: { conversationId, role: "assistant", content: completion.content } });

    await prisma.chatConversation.update({
      where: { id: conversationId },
      data: { messageCount: { increment: 1 }, lastActivityAt: new Date() },
    });

    let leadCaptured = false;
    if (leadIntent.isLead) {
      const lead = await captureLeadFromConversation(conversationId, userMessage.content, completion.content);
      leadCaptured = !!lead;
      if (lead) await trackLeadGenerated();
    }

    let message = completion.content;
    const bookingEnabled = settings?.enableBooking !== false;
    if (leadIntent.suggestsBooking && bookingEnabled) {
      const bookingUrl = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "https://calendar.app.google/45f7gXNps2jdx7AZ7";
      message += `\n\n---\n💬 **Want to discuss this further?** [Book a free consultation call](${bookingUrl}) to talk through your project with Emmett directly.`;
    }

    await trackChatMetric(conversationId);

    return NextResponse.json({
      message,
      conversationId,
      leadCaptured,
      bookingSuggested: leadIntent.suggestsBooking,
      humanHandoff: wantsHumanHandoff && !!(settings?.enableHumanHandoff),
    });
  } catch (error) {
    console.error("Chat completion error:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }

    // Update conversation timestamp even on error
    if (conversationId) {
      try {
        await prisma.chatConversation.update({
          where: { id: conversationId },
          data: { lastActivityAt: new Date() },
        }).catch(() => {});
      } catch { /* non-critical */ }
    }

    const fallbackMessage = knowledgeResults.length > 0
      ? "I found some relevant information about your question:\n\n" + knowledgeResults.map((r) => "**" + r.title + "**\n" + r.content.slice(0, 400)).join("\n\n") + "\n\nWould you like more details about any of these? You can also reach out directly at hello@emmettanthony.dev."
      : "Sorry, I encountered an error. Please try again or contact me directly at hello@emmettanthony.dev";

    return NextResponse.json(
      { error: "Chat completion failed", message: fallbackMessage, fallback: true },
      { status: 200 }
    );
  }
}
