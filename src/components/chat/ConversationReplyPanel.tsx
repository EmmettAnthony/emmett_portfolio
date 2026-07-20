"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, User, Bot, CheckCircle, Mail, Clock, Target, Star, Globe, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

interface LeadInfo {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  budget?: string | null;
  timeline?: string | null;
  status: string;
}

interface ConversationReplyPanelProps {
  conversationId: string;
  initialMessages: Message[];
  visitorName?: string | null;
  visitorEmail?: string | null;
  language?: string;
  source?: string;
  messageCount: number;
  status: string;
  createdAt: string;
  lead?: LeadInfo | null;
  feedback?: { score: number; comment?: string | null; category?: string | null }[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  WAITING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  RESOLVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ARCHIVED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
  ESCALATED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ConversationReplyPanel({
  conversationId,
  initialMessages,
  visitorName,
  visitorEmail,
  language,
  source,
  messageCount,
  status,
  createdAt,
  lead,
  feedback,
}: ConversationReplyPanelProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sent, setSent] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEscalated = currentStatus === "ESCALATED";
  const canReply = ["ACTIVE", "WAITING", "ESCALATED"].includes(currentStatus);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!reply.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: reply.trim(),
          sendEmail,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send reply");
      }

      const data = await res.json();

      // Add the new message to the list
      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          role: "assistant",
          content: reply.trim(),
          createdAt: new Date().toISOString(),
          metadata: { source: "admin_reply" },
        },
      ]);

      setReply("");
      setSent(true);
      if (data.status) setCurrentStatus(data.status);

      // Reset the "Sent!" indicator after a moment
      setTimeout(() => setSent(false), 3000);
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Messages + Reply */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Messages ({messages.length})
            </h2>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusColors[currentStatus] || ""}`}>
              {currentStatus}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">No messages yet</p>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const isAdminReply = msg.metadata?.source === "admin_reply";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : isAdminReply
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-zinc-100 dark:bg-zinc-800"
                      }`}
                    >
                      {isUser ? (
                        <User className="h-3.5 w-3.5" />
                      ) : isAdminReply ? (
                        <User className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                      ) : (
                        <Bot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        isUser
                          ? "bg-blue-600 text-white"
                          : isAdminReply
                          ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 dark:text-white"
                      }`}
                    >
                      {isAdminReply && (
                        <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wider">
                          Admin Reply
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Reply Form */}
        {canReply && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-blue-500" />
              Reply to Visitor
            </h3>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 flex-shrink-0 mt-1">
                <User className="h-4 w-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex-1 space-y-2">
                <textarea
                  ref={textareaRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isEscalated
                      ? "Write your reply to the visitor... (Enter to send, Shift+Enter for new line)"
                      : "Send a message to the visitor... (Enter to send, Shift+Enter for new line)"
                  }
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-zinc-300 text-blue-600"
                    />
                    <span className="text-xs text-zinc-500">
                      Notify visitor via email
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <AnimatePresence>
                      {sent && (
                        <motion.span
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center gap-1 text-xs text-green-600"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Sent!
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleSend}
                      disabled={!reply.trim() || sending}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!canReply && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-500">
              This conversation is <strong className="text-zinc-700 dark:text-zinc-300">{currentStatus}</strong>. Replies are disabled.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Information */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Information</h3>
          <div className="space-y-2 text-sm">
            {visitorName && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <User className="h-3.5 w-3.5" />
                <span>{visitorName}</span>
              </div>
            )}
            {visitorEmail && (
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${visitorEmail}`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {visitorEmail}
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Globe className="h-3.5 w-3.5" />
              <span>Language: {language || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>Source: {source}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Messages: {messageCount}</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Created: {new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Lead */}
        {lead && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-green-500" /> Lead
            </h3>
            <div className="space-y-1.5 text-sm">
              <p><span className="text-zinc-500">Name:</span> {lead.name}</p>
              <p><span className="text-zinc-500">Email:</span> {lead.email}</p>
              {lead.phone && <p><span className="text-zinc-500">Phone:</span> {lead.phone}</p>}
              {lead.company && <p><span className="text-zinc-500">Company:</span> {lead.company}</p>}
              {lead.budget && <p><span className="text-zinc-500">Budget:</span> {lead.budget}</p>}
              {lead.timeline && <p><span className="text-zinc-500">Timeline:</span> {lead.timeline}</p>}
              <p><span className="text-zinc-500">Status:</span> {lead.status}</p>
            </div>
          </div>
        )}

        {/* Feedback */}
        {feedback && feedback.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-yellow-500" /> Feedback
            </h3>
            {feedback.map((fb, i) => (
              <div key={i} className="text-sm space-y-1">
                <p><span className="text-zinc-500">Score:</span> {fb.score}/5</p>
                {fb.comment && <p><span className="text-zinc-500">Comment:</span> {fb.comment}</p>}
                {fb.category && <p><span className="text-zinc-500">Category:</span> {fb.category}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
