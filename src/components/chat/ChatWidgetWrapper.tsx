"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatProvider, useChat } from "./ChatProvider";
import { ChatBubble } from "./ChatBubble";
import { ChatWindow } from "./ChatWindow";

const EXIT_INTENT_THRESHOLD = 30; // pixels from top to trigger exit intent

interface WidgetConfig {
  enabled: boolean;
  enableWelcomeTrigger: boolean;
  welcomeDelayMs: number;
  enableExitIntent: boolean;
  exitIntentMessage: string;
  welcomeMessage: string;
}

// ─── Inner component that reads chat context ──────────────────────────────
function ChatTriggers({ config }: { config: WidgetConfig }) {
  const { open, sendMessage, visitorId, setTriggeredBy } = useChat();
  const hasTriggeredWelcome = useRef(false);
  const hasTriggeredExit = useRef(false);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHandledTestTrigger = useRef(false);

  useEffect(() => {
    // ═══════════════════════════════════════════════════════════════
    // Test Trigger: fires immediately when ?chat-test=welcome is set
    // (used by the "Send Test" button in the dashboard settings)
    // ═══════════════════════════════════════════════════════════════
    const params = new URLSearchParams(window.location.search);
    const testTrigger = params.get("chat-test");
    if (testTrigger === "welcome" && !hasHandledTestTrigger.current) {
      hasHandledTestTrigger.current = true;
      hasTriggeredWelcome.current = true;
      localStorage.setItem(`chat-welcome-shown-${visitorId}`, "true");

      setTriggeredBy("welcome");
      const testTimer = setTimeout(() => {
        open();
        setTimeout(() => {
          sendMessage(config.welcomeMessage);
        }, 600);
      }, 1200);

      // Clean the URL so refreshing doesn't re-trigger
      window.history.replaceState({}, "", window.location.pathname);

      return () => clearTimeout(testTimer);
    }

    // ═══════════════════════════════════════════════════════════════
    // Timed Welcome: open chat with a greeting after configurable delay
    // ═══════════════════════════════════════════════════════════════
    const welcomeKey = `chat-welcome-shown-${visitorId}`;
    const welcomeAlreadyShown = localStorage.getItem(welcomeKey);

    if (config.enableWelcomeTrigger && !welcomeAlreadyShown && !hasTriggeredWelcome.current) {
      welcomeTimerRef.current = setTimeout(() => {
        if (hasTriggeredWelcome.current) return;
        hasTriggeredWelcome.current = true;
        localStorage.setItem(welcomeKey, "true");

        fetch("/api/chat/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "welcome" }),
        }).catch(() => {});

        setTriggeredBy("welcome");
        open();
        setTimeout(() => {
          sendMessage(config.welcomeMessage);
        }, 600);
      }, config.welcomeDelayMs);
    }

    // ═══════════════════════════════════════════════════════════════
    // Exit Intent: when cursor leaves the viewport from the top
    // ═══════════════════════════════════════════════════════════════
    const exitKey = `chat-exit-shown-${visitorId}`;
    const exitAlreadyShown = localStorage.getItem(exitKey);

    function handleMouseLeave(e: MouseEvent) {
      if (!config.enableExitIntent) return;
      if (hasTriggeredExit.current || exitAlreadyShown) return;
      if (e.clientY > EXIT_INTENT_THRESHOLD) return;

      hasTriggeredExit.current = true;
      localStorage.setItem(exitKey, "true");

      fetch("/api/chat/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "exit-intent" }),
      }).catch(() => {});

      setTriggeredBy("exit-intent");
      open();
      setTimeout(() => {
        sendMessage(config.exitIntentMessage);
      }, 600);
    }

    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [open, sendMessage, visitorId, config.enableWelcomeTrigger, config.welcomeDelayMs, config.enableExitIntent, config.exitIntentMessage, config.welcomeMessage, setTriggeredBy]);

  return null;
}

// ─── Public wrapper ────────────────────────────────────────────────────────
export function ChatWidgetWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hide = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/chat");
  const [config, setConfig] = useState<WidgetConfig | null>(null);

  useEffect(() => {
    fetch("/api/chat/widget-config")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setConfig(data))
      .catch(() => setConfig(null));
  }, []);

  return (
    <ChatProvider>
      {children}
      {!hide && (
        <>
          {config && <ChatTriggers config={config} />}
          <ChatBubble />
          <ChatWindow />
        </>
      )}
    </ChatProvider>
  );
}
