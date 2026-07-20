import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { chatSettingsSchema, chatSettingsUpdateSchema } from "@/lib/validations/chatbot";
import { auth } from "@/../auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let settings = await prisma.chatSettings.findFirst();

    if (!settings) {
      // All default values are defined in the Prisma schema — create with defaults
      settings = await prisma.chatSettings.create({ data: {} });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch chat settings:", error);
    return NextResponse.json({ error: "Failed to fetch chat settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = chatSettingsUpdateSchema.parse(body);

    let settings = await prisma.chatSettings.findFirst();

    if (!settings) {
      settings = await prisma.chatSettings.create({
        data: {
          ...chatSettingsSchema.parse(body),
          provider: parsed.provider || "openai",
          model: parsed.model || "gpt-4o-mini",
        },
      });
    } else {
      settings = await prisma.chatSettings.update({
        where: { id: settings.id },
        data: {
          ...(parsed.provider !== undefined && { provider: parsed.provider }),
          ...(parsed.model !== undefined && { model: parsed.model }),
          ...(parsed.temperature !== undefined && { temperature: parsed.temperature }),
          ...(parsed.maxTokens !== undefined && { maxTokens: parsed.maxTokens }),
          ...(parsed.systemPrompt !== undefined && { systemPrompt: parsed.systemPrompt }),
          ...(parsed.welcomeMessage !== undefined && { welcomeMessage: parsed.welcomeMessage }),
          ...(parsed.suggestedQuestions !== undefined && { suggestedQuestions: parsed.suggestedQuestions }),
          ...(parsed.blockedWords !== undefined && { blockedWords: parsed.blockedWords }),
          ...(parsed.rateLimitPerMinute !== undefined && { rateLimitPerMinute: parsed.rateLimitPerMinute }),
          ...(parsed.rateLimitPerDay !== undefined && { rateLimitPerDay: parsed.rateLimitPerDay }),
          ...(parsed.maxConversationLength !== undefined && { maxConversationLength: parsed.maxConversationLength }),
          ...(parsed.enableFileSearch !== undefined && { enableFileSearch: parsed.enableFileSearch }),
          ...(parsed.enableLeadCapture !== undefined && { enableLeadCapture: parsed.enableLeadCapture }),
          ...(parsed.enableBooking !== undefined && { enableBooking: parsed.enableBooking }),
          ...(parsed.enableHumanHandoff !== undefined && { enableHumanHandoff: parsed.enableHumanHandoff }),
          ...(parsed.enableMultilingual !== undefined && { enableMultilingual: parsed.enableMultilingual }),
          ...(parsed.enableAnalytics !== undefined && { enableAnalytics: parsed.enableAnalytics }),
          ...(parsed.enableWelcomeTrigger !== undefined && { enableWelcomeTrigger: parsed.enableWelcomeTrigger }),
          ...(parsed.welcomeDelayMs !== undefined && { welcomeDelayMs: parsed.welcomeDelayMs }),
          ...(parsed.enableExitIntent !== undefined && { enableExitIntent: parsed.enableExitIntent }),
          ...(parsed.exitIntentMessage !== undefined && { exitIntentMessage: parsed.exitIntentMessage }),
          ...(parsed.widgetPosition !== undefined && { widgetPosition: parsed.widgetPosition }),
          ...(parsed.widgetColor !== undefined && { widgetColor: parsed.widgetColor }),
          ...(parsed.widgetTitle !== undefined && { widgetTitle: parsed.widgetTitle }),
          ...(parsed.widgetSubtitle !== undefined && { widgetSubtitle: parsed.widgetSubtitle }),
          ...(parsed.widgetAvatar !== undefined && { widgetAvatar: parsed.widgetAvatar }),
          ...(parsed.widgetSize !== undefined && { widgetSize: parsed.widgetSize }),
          ...(parsed.enabled !== undefined && { enabled: parsed.enabled }),
        },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to update chat settings:", error);
    if (error instanceof Error && error.name === "ZodError") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ZodError.errors
      return NextResponse.json({ error: "Invalid request", details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update chat settings" }, { status: 500 });
  }
}
