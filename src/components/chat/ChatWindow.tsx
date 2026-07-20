"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  Sparkles,
  Bot,
  ChevronDown
} from "lucide-react";
import { useChat } from "./ChatProvider";
import { cn } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatContactForm } from "./ChatContactForm";
import { ChatFeedback } from "./ChatFeedback";
import { ChatBookingCards } from "./ChatBookingCards";
import { useTranslations } from "next-intl";

export function ChatWindow() {
  const t = useTranslations("chat");
  const SUGGESTED_QUESTIONS = [
    t("suggestions.services"),
    t("suggestions.experience"),
    t("suggestions.portfolio"),
    t("suggestions.hire"),
    t("suggestions.technologies"),
    t("suggestions.booking"),
  ];
  const {
    isOpen,
    isFullScreen,
    messages,
    isTyping,
    sendMessage,
    close,
    setFullScreen,
    showContactForm,
    conversationId,
    feedbackScore,
    showBookingCards,
  } = useChat();

  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleSuggestion = async (question: string) => {
    setInput("");
    await sendMessage(question);
  };

  const feedbackGiven = feedbackScore !== null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={cn(
            "fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900",
            isFullScreen
              ? "inset-2 sm:inset-4"
              : "h-[600px] max-h-[calc(100dvh-10rem)] w-[calc(100vw-48px)] sm:w-[400px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{t("botName")}</h3>
                <p className="text-[10px] text-blue-100">
                  {isTyping ? t("typing") : t("online")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFullScreen(!isFullScreen)}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={isFullScreen ? t("minimize") : t("maximize")}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={close}
                className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="relative flex-1 overflow-y-auto px-4 py-4"
          >
            {messages.length === 0 && !isTyping ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="text-lg font-semibold text-zinc-900 dark:text-white">
                  {t("welcomeTitle")}
                </h4>
                <p className="mt-2 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
                  {t("welcomeDescription")}
                </p>
                <ChatSuggestions
                  questions={SUGGESTED_QUESTIONS}
                  onSelect={handleSuggestion}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                      <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.1s]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />

                {/* Lead capture form */}
                {showContactForm && <ChatContactForm />}

                {/* Booking cards */}
                {showBookingCards && <ChatBookingCards />}

                {/* Feedback */}
                {messages.length >= 4 && !feedbackGiven && conversationId && (
                  <ChatFeedback />
                )}
              </div>
            )}

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-white p-2 shadow-lg dark:bg-zinc-800"
                >
                  <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-zinc-200 p-3 dark:border-zinc-700"
          >
            <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-1 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("inputPlaceholder")}
                disabled={isTyping}
                className="flex-1 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-white dark:placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
