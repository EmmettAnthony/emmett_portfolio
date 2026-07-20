"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Bot, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetLivePreviewProps {
  widgetPosition: "right" | "left";
  widgetColor: string;
  widgetTitle: string;
  widgetSubtitle: string;
  widgetSize: "sm" | "md" | "lg";
  enabled: boolean;
}

const sizeMap = {
  sm: {
    bubble: "h-10 w-10",
    icon: "h-4 w-4",
    window: "h-[220px] w-[200px]",
    header: "px-3 py-2",
    headerIcon: "h-7 w-7",
    headerIconSize: "h-4 w-4",
    title: "text-[11px]",
    subtitle: "text-[9px]",
  },
  md: {
    bubble: "h-12 w-12",
    icon: "h-5 w-5",
    window: "h-[260px] w-[230px]",
    header: "px-3 py-2.5",
    headerIcon: "h-8 w-8",
    headerIconSize: "h-[18px] w-[18px]",
    title: "text-xs",
    subtitle: "text-[10px]",
  },
  lg: {
    bubble: "h-14 w-14",
    icon: "h-6 w-6",
    window: "h-[300px] w-[260px]",
    header: "px-4 py-3",
    headerIcon: "h-9 w-9",
    headerIconSize: "h-5 w-5",
    title: "text-sm",
    subtitle: "text-[10px]",
  },
};

export function WidgetLivePreview({
  widgetPosition,
  widgetColor,
  widgetTitle,
  widgetSubtitle,
  widgetSize,
  enabled,
}: WidgetLivePreviewProps) {
  const isRight = widgetPosition !== "left";
  const s = sizeMap[widgetSize];

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Preview header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
            <div className="h-2 w-2 rounded-full bg-green-400" />
          </div>
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
            Live Preview
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-zinc-400 dark:text-zinc-500">
          <span>{widgetPosition === "right" ? "Right" : "Left"}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span className="capitalize">{widgetSize}</span>
          <span className="text-zinc-300 dark:text-zinc-600">·</span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              enabled ? "text-green-500" : "text-red-400"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                enabled ? "bg-green-500" : "bg-red-400"
              )}
            />
            {enabled ? "On" : "Off"}
          </span>
        </div>
      </div>

      {/* Preview viewport */}
      <div className="relative h-[260px] overflow-hidden bg-white dark:bg-zinc-900">
        {/* Mock page content (skeleton) */}
        <div className="p-5">
          <div className="mx-auto mb-2 h-3 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="mx-auto mb-4 h-6 w-48 rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50"
              >
                <div className="mb-1 h-2 w-10 rounded bg-zinc-100 dark:bg-zinc-700" />
                <div className="h-2 w-16 rounded bg-zinc-100 dark:bg-zinc-700" />
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2 w-full rounded bg-zinc-50 dark:bg-zinc-800/50" />
            <div className="h-2 w-3/4 rounded bg-zinc-50 dark:bg-zinc-800/50" />
          </div>
        </div>

        {/* ─── Live Chat Bubble ─────────────────────────────────────── */}
        {enabled && (
          <div
            className={cn(
              "absolute bottom-5",
              isRight ? "right-5" : "left-5"
            )}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.3,
              }}
            >
              <button
                className={cn(
                  "flex items-center justify-center rounded-full text-white shadow-lg",
                  s.bubble
                )}
                style={{ backgroundColor: widgetColor }}
              >
                <MessageCircle className={s.icon} />
              </button>
            </motion.div>
          </div>
        )}

        {/* ─── Live Mini Chat Window ────────────────────────────────── */}
        <AnimatePresence>
          {enabled && (
            <motion.div
              key="live-preview-window"
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", duration: 0.4, delay: 0.15 }}
              className={cn(
                "absolute bottom-20 flex flex-col overflow-hidden rounded-xl border shadow-lg",
                "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
                s.window,
                isRight ? "right-5" : "left-5"
              )}
            >
              {/* Chat header */}
              <div
                className={cn(
                  "flex items-center justify-between",
                  s.header
                )}
                style={{
                  background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full bg-white/20",
                      s.headerIcon
                    )}
                  >
                    <Bot className={cn("text-white", s.headerIconSize)} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate font-semibold text-white",
                        s.title
                      )}
                    >
                      {widgetTitle || "Assistant"}
                    </p>
                    <p
                      className={cn(
                        "truncate text-white/80",
                        s.subtitle
                      )}
                    >
                      {widgetSubtitle || "Online"}
                    </p>
                  </div>
                </div>
                <button className="rounded-md p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Mini message area */}
              <div className="flex flex-1 items-center justify-center px-3">
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <Bot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800">
                    <p className="text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      Hi! How can I help you today?
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini input bar */}
              <div className="border-t border-zinc-200 px-2 py-1.5 dark:border-zinc-700">
                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-600 dark:bg-zinc-800">
                  <input
                    type="text"
                    disabled
                    placeholder="Type..."
                    className="flex-1 bg-transparent py-0.5 text-[10px] text-zinc-400 outline-none placeholder:text-zinc-400 dark:text-zinc-500"
                  />
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-md opacity-60"
                    style={{ backgroundColor: widgetColor }}
                  >
                    <Send className="h-2.5 w-2.5 text-white" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disabled overlay */}
        {!enabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] dark:bg-zinc-900/60">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-5 py-3 shadow-lg dark:bg-zinc-800">
              <MessageCircle className="h-5 w-5 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Widget is disabled
              </p>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                Toggle &quot;Chatbot Enabled&quot; above to show preview
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
