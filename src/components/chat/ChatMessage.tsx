"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bot, Copy, Check, ExternalLink, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ChatMessageData } from "@/types/chatbot";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return formatTime(isoString);
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + formatTime(isoString);
}

function CodeBlock({ className, children, ...props }: React.ComponentPropsWithoutRef<"code">) {
  const t = useTranslations("chat");
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (language) {
    return (
      <div className="my-2 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between bg-zinc-50 px-4 py-1.5 dark:bg-zinc-800">
          <span className="text-[10px] font-medium uppercase text-zinc-500 dark:text-zinc-400">
            {language}
          </span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
            {copied ? (
              <><Check className="h-3 w-3" /> {t("copied")}</>
            ) : (
              <><Copy className="h-3 w-3" /> {t("copy")}</>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto bg-zinc-950 px-4 py-3">
          <code className={cn("text-xs leading-relaxed text-zinc-100", className)} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-mono text-blue-600 dark:bg-zinc-800 dark:text-blue-400" {...props}>
      {children}
    </code>
  );
}

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const t = useTranslations("chat");
  const isUser = message.role === "user";
  const isError = message.metadata?.isError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}
    >
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", isUser ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800")}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
      </div>

      <div className={cn("max-w-[80%] space-y-1.5 rounded-2xl px-4 py-2.5", isUser ? "bg-blue-600 text-white" : isError ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-zinc-100 dark:bg-zinc-800")}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose-chat max-w-none text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code: CodeBlock,
                a: ({ href, children, ...props }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400" {...props}>
                    {children}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ),
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs border-collapse border border-zinc-300 dark:border-zinc-600" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-left font-semibold dark:border-zinc-600 dark:bg-zinc-800" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="border border-zinc-300 px-3 py-1.5 dark:border-zinc-600" {...props}>
                    {children}
                  </td>
                ),
                blockquote: ({ children, ...props }) => (
                  <blockquote className="my-2 border-l-4 border-zinc-300 pl-4 italic text-zinc-500 dark:border-zinc-600 dark:text-zinc-400" {...props}>
                    {children}
                  </blockquote>
                ),
                ul: ({ children, ...props }) => (
                  <ul className="my-1 ml-4 list-disc space-y-0.5" {...props}>{children}</ul>
                ),
                ol: ({ children, ...props }) => (
                  <ol className="my-1 ml-4 list-decimal space-y-0.5" {...props}>{children}</ol>
                ),
                li: ({ children, ...props }) => (
                  <li className="text-sm leading-relaxed" {...props}>{children}</li>
                ),
                h1: ({ children, ...props }) => (
                  <h1 className="my-3 text-base font-bold" {...props}>{children}</h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2 className="my-2 text-sm font-bold" {...props}>{children}</h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3 className="my-2 text-sm font-semibold" {...props}>{children}</h3>
                ),
                hr: () => <hr className="my-3 border-zinc-200 dark:border-zinc-700" />,
                input: ({ type, checked, ...props }) => (
                  type === "checkbox" ? (
                    <input type="checkbox" checked={checked} readOnly className="mr-1.5 h-3.5 w-3.5 accent-blue-600" {...props} />
                  ) : (
                    <input {...props} />
                  )
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div className={cn("flex items-center gap-1", isUser ? "justify-start" : "justify-start")}>
          <Clock className="h-3 w-3 opacity-50" />
          <span className="text-[10px] opacity-50">{formatDate(message.createdAt)}</span>
        </div>

        {message.metadata?.leadCaptured === true && (
          <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 dark:bg-green-900/20">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] font-medium text-green-700 dark:text-green-400">{t("leadCaptured")}</span>
          </div>
        )}

        {message.metadata?.humanHandoff === true && (
          <div className="rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-900/20">
            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
              {t("humanHandoff.message")}
            </p>
            <p className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-500">
              {t("humanHandoff.contactPrefix")}{" "}
              <a href="mailto:hello@emmettanthony.dev" className="underline">hello@emmettanthony.dev</a>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
