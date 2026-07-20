"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bot,
  MessageCircle,
  Sparkles,
  Send,
  MousePointer2,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatTriggerPreviewProps {
  open: boolean;
  onClose: () => void;
  welcomeMessage?: string;
  exitIntentMessage?: string;
  widgetColor?: string;
  widgetTitle?: string;
  widgetSubtitle?: string;
  welcomeDelayMs?: number;
  widgetPosition?: "right" | "left";
  widgetSize?: "sm" | "md" | "lg";
  suggestedQuestions?: string[];
  previewMode?: "welcome" | "exit-intent";
  onPreviewModeChange?: (mode: "welcome" | "exit-intent") => void;
}

const SUGGESTED_QUESTIONS_FALLBACK = [
  "What services do you offer?",
  "Tell me about your experience",
  "Can you show me your portfolio?",
  "Book a consultation call",
];

type PreviewPhase = "idle" | "cursor-moving" | "bubble-visible" | "opened" | "message-shown";

export function ChatTriggerPreview({
  open,
  onClose,
  welcomeMessage = "Hi! How can I help you today?",
  exitIntentMessage = "👋 Before you go! I'd love to help...",
  widgetColor = "#2563eb",
  widgetTitle = "Emmett's AI Assistant",
  widgetSubtitle = "Online",
  welcomeDelayMs = 2000,
  widgetPosition = "right",
  widgetSize = "md",
  suggestedQuestions,
  previewMode = "welcome",
  onPreviewModeChange,
}: ChatTriggerPreviewProps) {

  const [phase, setPhase] = useState<PreviewPhase>("idle");
  const [showBubbleHint, setShowBubbleHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewDelay = Math.min(welcomeDelayMs, 3000); // cap preview delay at 3s

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    setPhase("idle");
    setShowBubbleHint(false);
  }, []);

  // Reset phase whenever previewMode changes
  useEffect(() => {
    const timer = setTimeout(() => {
      reset();
    }, 0);
    return () => clearTimeout(timer);
  }, [previewMode, reset]);

  // Welcome trigger auto-play
  useEffect(() => {
    if (!open || previewMode !== "welcome") {
      if (previewMode !== "welcome") {
        const timer = setTimeout(() => reset(), 0);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Phase 1: Show the bubble after a brief pause
    timerRef.current = setTimeout(() => {
      setPhase("bubble-visible");

      // Phase 2: Open the chat after the configured delay
      welcomeTimerRef.current = setTimeout(() => {
        setPhase("opened");

        // Phase 3: Show the welcome message being sent
        setTimeout(() => {
          setPhase("message-shown");
        }, 800);
      }, previewDelay);
    }, 600);

    return reset;
  }, [open, previewDelay, reset, previewMode]);

  const triggerExitIntent = useCallback(() => {
    if (previewMode !== "exit-intent") return;
    reset();

    // Phase 1: Animate cursor moving upward
    setPhase("cursor-moving");

    // Phase 2: Show the bubble after cursor exits
    welcomeTimerRef.current = setTimeout(() => {
      setPhase("bubble-visible");

      // Phase 3: Open the chat
      setTimeout(() => {
        setPhase("opened");

        // Phase 4: Show the exit intent message
        setTimeout(() => {
          setPhase("message-shown");
        }, 800);
      }, 1000);
    }, 1200);
  }, [previewMode, reset]);

  // Show hint text after a moment
  useEffect(() => {
    if (!open || phase !== "idle") return;
    const hintTimer = setTimeout(() => setShowBubbleHint(true), 200);
    return () => clearTimeout(hintTimer);
  }, [open, phase]);

  // ─── Size mapping ────────────────────────────────────────────────────
  const sizeMap = {
    sm: { window: "h-[380px] w-[320px] sm:h-[420px] sm:w-[340px]", bubble: "h-12 w-12" },
    md: { window: "h-[500px] w-[360px] sm:h-[540px] sm:w-[380px]", bubble: "h-14 w-14" },
    lg: { window: "h-[600px] w-[400px] sm:h-[640px] sm:w-[420px]", bubble: "h-16 w-16" },
  };

  const isRight = widgetPosition !== "left";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="preview-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close button (top-right of viewport) */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
            Exit Preview
          </motion.button>

          {/* Preview mode tabs */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute left-4 top-4 flex gap-1.5"
          >
            <button
              onClick={() => onPreviewModeChange?.("welcome")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                previewMode === "welcome"
                  ? "bg-white text-zinc-900 shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              Welcome Trigger
            </button>
            <button
              onClick={() => onPreviewModeChange?.("exit-intent")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                previewMode === "exit-intent"
                  ? "bg-white text-zinc-900 shadow-lg"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              Exit Intent
            </button>
          </motion.div>

          {/* Simulated page viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative h-[85vh] max-h-[720px] w-[95vw] max-w-[480px] overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl dark:bg-zinc-900"
          >
            {/* Mock page header */}
            <div className="flex h-12 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 dark:border-zinc-700 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <div className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                <span>emmettanthony.dev</span>
              </div>
              <div className="w-14" />
            </div>

            {/* Mock page content */}
            <div className="p-6">
              {/* Hero section mock */}
              <div className="mb-6">
                <div className="mx-auto mb-3 h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mx-auto mb-2 h-10 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
                <div className="mx-auto h-3 w-56 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>

              {/* Cards mock */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800"
                  >
                    <div className="mb-2 h-3 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
                    <div className="mt-2 h-2 w-12 rounded bg-zinc-200/50 dark:bg-zinc-700/50" />
                  </div>
                ))}
              </div>

              {/* Features mock */}
              <div className="mt-4 space-y-3">
                <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-3 w-5/6 rounded bg-zinc-100 dark:bg-zinc-800" />
              </div>

              {/* Timeline step indicators */}
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-200 dark:bg-blue-800" />
                    <div className="h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="ml-4 h-2 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="ml-4 h-2 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-zinc-200 dark:bg-zinc-700" />
                    <div className="h-3 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
                  </div>
                  <div className="ml-4 h-2 w-44 rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            </div>

            {/* ─── Chat Bubble ─────────────────────────────────────────── */}
            <AnimatePresence>
              {phase === "bubble-visible" && (
                <motion.div
                  key={previewMode === "exit-intent" ? "exit-bubble" : "welcome-bubble"}
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={
                    previewMode === "exit-intent"
                      ? { opacity: [0, 0, 1], scale: [0.5, 0.8, 1], y: [10, -5, 0] }
                      : { opacity: 1, scale: 1, y: 0 }
                  }
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={
                    previewMode === "exit-intent"
                      ? { duration: 0.6, times: [0, 0.3, 1] }
                      : { type: "spring", duration: 0.4 }
                  }
                  className={cn(
                    "absolute bottom-6 z-10",
                    isRight ? "right-6" : "left-6"
                  )}
                >
                  <motion.button
                    className={cn(
                      "flex items-center justify-center rounded-full text-white shadow-xl",
                      sizeMap[widgetSize].bubble
                    )}
                    style={{ backgroundColor: widgetColor }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle className="h-6 w-6" />
                  </motion.button>

                  {/* Exit intent: notification badge on bubble */}
                  {previewMode === "exit-intent" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow"
                    >
                      1
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Chat Window ─────────────────────────────────────────── */}
            <AnimatePresence>
              {(phase === "opened" || phase === "message-shown") && (
                <motion.div
                  key="preview-window"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.4 }}
                  className={cn(
                    "absolute bottom-24 z-20 flex flex-col overflow-hidden rounded-2xl border shadow-2xl",
                    "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
                    sizeMap[widgetSize].window,
                    isRight ? "right-6" : "left-6"
                  )}
                >
                  {/* Chat header */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {widgetTitle}
                        </h3>
                        <p className="text-[10px] text-white/80">{widgetSubtitle}</p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    {/* Empty state (before message arrives) */}
                    {phase === "opened" && (
                      <div className="flex h-full flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                          <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                          {widgetTitle}
                        </h4>
                        <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                          {widgetSubtitle === "Online"
                            ? "I'm here to help! Ask me anything."
                            : widgetSubtitle}
                        </p>

                        {/* Suggested questions */}
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Suggested questions:
                          </p>
                          <div className="flex flex-wrap justify-center gap-2">
                            {(suggestedQuestions ?? SUGGESTED_QUESTIONS_FALLBACK)
                              .slice(0, 4)
                              .map((q: string, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {q}
                                </span>
                              ))}
                          </div>
                        </div>

                        {/* Proactive typing indicator */}
                        <div className="mt-6 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 dark:bg-blue-900/20">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:0.2s]" />
                          </div>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            Emmett&apos;s AI is typing...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Welcome / Exit intent message shown */}
                    {phase === "message-shown" && (
                      <div className="space-y-4">
                        {/* Message header tag */}
                        {previewMode === "exit-intent" && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <LogOut className="h-3 w-3" />
                              Exit Intent
                            </span>
                          </div>
                        )}

                        {/* AI message */}
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 dark:bg-zinc-800">
                            <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                              {previewMode === "exit-intent" ? exitIntentMessage : welcomeMessage}
                            </p>
                          </div>
                        </div>

                        {/* Simulated suggested reply chips */}
                        <div className="flex flex-wrap justify-end gap-2">
                          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            Tell me more!
                          </span>
                          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
                            No thanks
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input area */}
                  <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-1 dark:border-zinc-600 dark:bg-zinc-800">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        disabled
                        className="flex-1 bg-transparent py-2 text-sm text-zinc-400 outline-none placeholder:text-zinc-400 dark:text-zinc-500"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg opacity-50"
                        style={{ backgroundColor: widgetColor }}
                      >
                        <Send className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Exit Intent: cursor movement animation ────────────── */}
            {previewMode === "exit-intent" && phase === "cursor-moving" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-0 z-20"
              >
                {/* Mouse cursor animating upward */}
                <motion.div
                  initial={{ opacity: 0, x: 200, y: 400 }}
                  animate={{ opacity: [0, 1, 1, 0], x: [200, 180, 120, 80], y: [400, 200, 80, -20] }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="absolute"
                >
                  <div className="flex items-center gap-2 rounded-full bg-zinc-800/90 px-3 py-1.5 shadow-lg">
                    <MousePointer2 className="h-4 w-4 text-white" />
                    <span className="text-[10px] font-medium text-white/90">Cursor leaving...</span>
                  </div>
                </motion.div>

                {/* Trailing glow effect */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.15, 0.3, 0] }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute right-12 top-1/2 h-32 w-1 rounded-full bg-gradient-to-b from-transparent via-blue-400 to-transparent"
                  style={{ transform: "translateY(-50%)" }}
                />
              </motion.div>
            )}

            {/* ─── Exit Intent: status hint about triggering ──────────── */}
            {previewMode === "exit-intent" && phase === "idle" && showBubbleHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "absolute bottom-6 z-10 flex items-center gap-2 rounded-full bg-amber-500/90 px-4 py-2 text-xs font-medium text-white shadow-lg",
                  isRight ? "right-6" : "left-6"
                )}
              >
                <LogOut className="h-3.5 w-3.5" />
                Click trigger to simulate page exit
              </motion.div>
            )}

            {/* ─── Exit Intent: Trigger button ────────────────────────── */}
            {previewMode === "exit-intent" && phase === "idle" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                onClick={triggerExitIntent}
                className={cn(
                  "absolute bottom-24 z-10 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-xl transition-all hover:scale-105 active:scale-95",
                  isRight ? "right-6" : "left-6"
                )}
                style={{
                  background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`,
                }}
              >
                <MousePointer2 className="h-4 w-4" />
                Trigger Exit Intent
              </motion.button>
            )}

            {/* Preview state indicator (welcome mode) */}
            {previewMode === "welcome" && phase === "bubble-visible" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={cn(
                  "absolute bottom-24 rounded-full bg-zinc-800/80 px-3 py-1.5 text-[10px] text-white shadow-lg dark:bg-zinc-700/80",
                  isRight ? "right-6" : "left-6"
                )}
              >
                Opening in {Math.round(previewDelay / 1000)}s...
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
