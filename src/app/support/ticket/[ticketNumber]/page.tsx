"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Send, Star, MessageSquare } from "lucide-react";
import Link from "next/link";

type Ticket = {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  preferredContact: string | null;
  status: { id: string; name: string; slug: string; color: string | null };
  priority: { id: string; name: string; slug: string; color: string | null; level: number } | null;
  category: { id: string; name: string; slug: string } | null;
  createdAt: string;
  closedAt: string | null;
  replies: {
    id: string;
    body: string;
    isStaff: boolean;
    staffName: string | null;
    createdAt: string;
    author: { id: string; name: string | null; email: string | null } | null;
  }[];
  ratings: { id: string; rating: number; comment: string | null }[];
};

export default function TicketDetailPage({ params }: { params: Promise<{ ticketNumber: string }> }) {
  const { ticketNumber } = use(params);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyBody, setReplyBody] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState("");

  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/support/tickets/${ticketNumber}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Ticket not found");
        }
        return res.json();
      })
      .then(setTicket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticketNumber]);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !ticket) return;
    setReplySubmitting(true);
    setReplyError("");
    try {
      const res = await fetch("/api/support/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, body: replyBody }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to submit reply");
      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          replies: [...prev.replies, result.reply],
        };
      });
      setReplyBody("");
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch clause error type
    } catch (err: any) {
      setReplyError(err.message || "Something went wrong");
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleRating() {
    if (!ticket || ratingValue === 0) return;
    setRatingSubmitting(true);
    setRatingError("");
    try {
      const res = await fetch("/api/support/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id, rating: ratingValue, comment: ratingComment || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to submit rating");
      setRatingSubmitted(true);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch clause error type
    } catch (err: any) {
      setRatingError(err.message || "Something went wrong");
    } finally {
      setRatingSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Support
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900 dark:bg-red-950/30">
          <p className="text-lg font-medium text-red-700 dark:text-red-400">{error || "Ticket not found"}</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400/80">Please check your ticket number and try again.</p>
        </div>
      </div>
    );
  }

  const isClosed = ticket.status.slug === "CLOSED" || ticket.closedAt !== null;
  const hasRating = ticket.ratings && ticket.ratings.length > 0 && !ratingSubmitted;

  function statusColor(slug: string): string {
    const map: Record<string, string> = {
      OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      WAITING_ON_CLIENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      WAITING_ON_STAFF: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      RESOLVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      CLOSED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
    };
    return map[slug] || "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";
  }

  function priorityColor(slug: string): string {
    const map: Record<string, string> = {
      LOW: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
      NORMAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      CRITICAL: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return map[slug] || "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/support" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Support
      </Link>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColor(ticket.status.slug)}`}>
            {ticket.status.name}
          </span>
          {ticket.priority && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityColor(ticket.priority.slug)}`}>
              {ticket.priority.name}
            </span>
          )}
          {ticket.category && (
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {ticket.category.name}
            </span>
          )}
          <span className="ml-auto font-mono text-xs text-zinc-500 dark:text-zinc-500">
            {ticket.ticketNumber}
          </span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">{ticket.subject}</h1>
        <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{ticket.description}</p>

        <div className="flex flex-wrap gap-6 text-xs text-zinc-500 dark:text-zinc-500">
          <span>From: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.fullName}</strong></span>
          <span>Email: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.email}</strong></span>
          {ticket.phone && <span>Phone: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.phone}</strong></span>}
          {ticket.company && <span>Company: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.company}</strong></span>}
          {ticket.preferredContact && <span>Preferred contact: <strong className="text-zinc-700 dark:text-zinc-300">{ticket.preferredContact}</strong></span>}
          <span>Opened: <strong className="text-zinc-700 dark:text-zinc-300">{format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}</strong></span>
        </div>
      </div>

      {ticket.replies.length > 0 && (
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            <MessageSquare className="mr-2 inline-block h-5 w-5" />
            Conversation ({ticket.replies.length})
          </h2>
          {ticket.replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                reply.isStaff
                  ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {reply.isStaff ? (reply.staffName || "Support Team") : ticket.fullName}
                  {reply.isStaff && (
                    <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Staff
                    </span>
                  )}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  {format(new Date(reply.createdAt), "MMM d, yyyy h:mm a")}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      {!isClosed && (
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add a Reply</h2>
          {replyError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {replyError}
            </div>
          )}
          <form onSubmit={handleReply} className="space-y-4">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={4}
              placeholder="Type your message here..."
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={replySubmitting || !replyBody.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {replySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {replySubmitting ? "Sending..." : "Send Reply"}
            </button>
          </form>
        </div>
      )}

      {isClosed && !hasRating && !ratingSubmitted && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Rate Your Experience</h2>
          {ratingError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
              {ratingError}
            </div>
          )}
          <div className="mb-4 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingValue(star)}
                className={`h-8 w-8 rounded-lg transition-colors ${
                  star <= ratingValue
                    ? "text-amber-400"
                    : "text-zinc-300 dark:text-zinc-600"
                }`}
              >
                <Star className={`h-full w-full ${star <= ratingValue ? "fill-current" : ""}`} />
              </button>
            ))}
          </div>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            rows={3}
            placeholder="Any additional feedback? (optional)"
            className="mb-4 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleRating}
            disabled={ratingSubmitting || ratingValue === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {ratingSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
            {ratingSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}

      {ratingSubmitted && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Thank you for your feedback!</p>
        </div>
      )}
    </div>
  );
}
