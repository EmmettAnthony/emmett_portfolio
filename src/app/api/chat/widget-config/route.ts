import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.chatSettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        enabled: true,
        enableWelcomeTrigger: true,
        welcomeDelayMs: 15000,
        enableExitIntent: true,
        exitIntentMessage: "👋 Before you go! I'd love to help with your next project. Whether you need a website, web app, CRM, or just have a question — I'm here to chat. What's on your mind?",
        welcomeMessage: "Hi! I'm Emmett's AI assistant. How can I help you today?",
        widgetPosition: "right",
        widgetColor: "#2563eb",
        widgetTitle: "Chat with Emmett",
        widgetSubtitle: "AI Assistant",
        widgetSize: "md",
      });
    }

    return NextResponse.json({
      enabled: settings.enabled,
      enableWelcomeTrigger: settings.enableWelcomeTrigger,
      welcomeDelayMs: settings.welcomeDelayMs,
      enableExitIntent: settings.enableExitIntent,
      exitIntentMessage: settings.exitIntentMessage,
      welcomeMessage: settings.welcomeMessage,
      widgetPosition: settings.widgetPosition,
      widgetColor: settings.widgetColor,
      widgetTitle: settings.widgetTitle,
      widgetSubtitle: settings.widgetSubtitle,
      widgetSize: settings.widgetSize,
    });
  } catch {
    // Graceful fallback — default config
    return NextResponse.json({
      enabled: true,
      enableWelcomeTrigger: true,
      welcomeDelayMs: 15000,
      enableExitIntent: true,
      welcomeMessage: "Hi! I'm Emmett's AI assistant. How can I help you today?",
      widgetPosition: "right",
      widgetColor: "#2563eb",
      widgetTitle: "Chat with Emmett",
      widgetSubtitle: "AI Assistant",
      widgetSize: "md",
    });
  }
}
