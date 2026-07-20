"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Send, Loader2, Sparkles, Bot, ArrowLeft, Phone, Mail, Calendar } from "lucide-react";

const GOOGLE_CALENDAR_URL = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL || "https://calendar.app.google/45f7gXNps2jdx7AZ7";
import { ChatMessage } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import { ChatContactForm } from "./ChatContactForm";
import { ChatFeedback } from "./ChatFeedback";
import type { ChatMessageData } from "@/types/chatbot";
import { useTranslations } from "next-intl";

export function FullPageChat() {
  const t = useTranslations("chat");
  const SUGGESTED_QUESTIONS = [
    t("suggestions.services"),
    t("suggestions.experience"),
    t("suggestions.portfolio"),
    t("suggestions.hire"),
    t("suggestions.booking"),
    t("suggestions.technologies"),
  ];
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [feedbackScore, setFeedbackScore] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const saved = sessionStorage.getItem("chat-conversation-id");
      if (saved) setConversationId(saved);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem("chat-conversation-id", conversationId);
    }
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: ChatMessageData = {
      id: "user-" + Date.now(),
      conversationId: conversationId || "",
      role: "user",
      content,
      metadata: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);
    setInput("");

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content });

      const response = await fetch("/api/chat/completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          conversationId,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Failed");

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const assistantId = "assistant-" + Date.now();
        let accumulated = "";
        let newConvId = conversationId;

        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            conversationId: conversationId || "",
            role: "assistant",
            content: "",
            metadata: null,
            createdAt: new Date().toISOString(),
          },
        ]);

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- SSE stream parse type
            let data: any;
            try { data = JSON.parse(line.slice(6)); } catch { continue; }

            if (data.type === "done") {
              newConvId = data.conversationId;
              setConversationId(newConvId);
              if (data.humanHandoff) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, metadata: { ...m.metadata, humanHandoff: true } } : m
                  )
                );
              }
            } else if (data.type === "lead_captured") {
              setShowContactForm(false);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, metadata: { ...m.metadata, leadCaptured: true } } : m
                )
              );
            } else if (data.content) {
              accumulated += data.content;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              );
            }
          }
        }
      } else {
        const data = await response.json();
        setConversationId(data.conversationId);

        const assistantMsg: ChatMessageData = {
          id: "assistant-" + Date.now(),
          conversationId: data.conversationId,
          role: "assistant",
          content: data.message,
          metadata: {
            ...(data.leadCaptured ? { leadCaptured: true } : {}),
            ...(data.humanHandoff ? { humanHandoff: true } : {}),
          },
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.leadCaptured) {
          setShowContactForm(false);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "error-" + Date.now(),
          conversationId: conversationId || "",
          role: "assistant",
          content: t("error"),
          metadata: { isError: true },
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="mx-auto flex h-screen max-w-4xl flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {t("fullPage.title")}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("fullPage.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-10 w-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("welcomeTitle")}
              </h2>
              <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
                {t("fullPage.welcomeDescription1")}
                {t("fullPage.welcomeDescription2")}
              </p>
              <div className="mt-8">
                <ChatSuggestions questions={SUGGESTED_QUESTIONS} onSelect={sendMessage} />
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {showContactForm && (
            <ChatContactForm
              conversationId={conversationId}
              sendMessage={sendMessage}
              setShowContactForm={setShowContactForm}
            />
          )}

          {messages.length >= 4 && feedbackScore === null && conversationId && (
            <ChatFeedback conversationId={conversationId} setFeedbackScore={setFeedbackScore} />
          )}

          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
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
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-300 bg-white px-4 py-2 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 dark:border-zinc-600 dark:bg-zinc-800">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("fullPage.inputPlaceholder")}
              disabled={isTyping}
              className="flex-1 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-50 dark:text-white dark:placeholder:text-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:+1234567890"
              className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Phone className="h-3 w-3" /> {t("fullPage.call")}
            </a>
            <a
              href="mailto:hello@emmettanthony.dev"
              className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Mail className="h-3 w-3" /> {t("fullPage.email")}
            </a>
            <a
              href={GOOGLE_CALENDAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <Calendar className="h-3 w-3" /> {t("fullPage.bookCall")}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
