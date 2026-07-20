"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertCircle, Paperclip, Send, Loader2, User } from "lucide-react";
import Link from "next/link";

interface TicketDetail {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: { name: string; color: string | null; slug: string; isClosed: boolean };
  priority: { name: string; color: string | null; level: number } | null;
  category: { name: string } | null;
  createdAt: string;
  updatedAt: string;
  replies: Array<{
    id: string;
    body: string;
    isStaff: boolean;
    staffName: string | null;
    createdAt: string;
    author: { id: string; name: string | null; email: string | null } | null;
  }>;
  attachments: Array<{
    id: string;
    fileName: string;
    url: string;
  }>;
}

export default function PortalTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/tickets/${params.id}`)
      .then(async (res) => {
        if (!res.ok) { if (res.status === 401) router.push("/portal"); throw new Error("Failed to load"); }
        return res.json();
      })
      .then((data) => setTicket(data))
      .catch((err) => { if (err.message !== "Failed to load") setError(err.message); })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/portal/tickets/${params.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyBody }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setReplyBody("");
      const updated = await fetch(`/api/portal/tickets/${params.id}`).then(r => r.json());
      setTicket(updated);
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Catch clause error type
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pt-24">
        <div className="mx-auto max-w-3xl px-4"><div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900 pt-24">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-zinc-500">Ticket not found</p>
          <Link href="/portal/tickets" className="text-primary hover:underline">Back to tickets</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <div className="mx-auto max-w-3xl px-4 py-24">
        <Link href="/portal/tickets" className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono font-medium text-zinc-400">{ticket.ticketNumber}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ticket.status.color || "bg-zinc-100 text-zinc-700"}`}>{ticket.status.name}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ticket.priority?.color || "text-zinc-600"}`}><AlertCircle className="h-3 w-3" />{ticket.priority?.name || "Normal"}</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
            {ticket.category && <span>{ticket.category.name}</span>}
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{ticket.description}</p>
          {ticket.attachments.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-700">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">Attachments</p>
              <div className="space-y-1">
                {ticket.attachments.map((att) => (
                  <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Paperclip className="h-3 w-3" />{att.fileName}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Replies ({ticket.replies.length})</h2>
          <div className="space-y-4">
            {ticket.replies.map((reply) => (
              <div key={reply.id} className={`rounded-xl border p-4 ${reply.isStaff ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"}`}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-white">
                    <User className="h-3 w-3 text-zinc-400" />
                    {reply.isStaff ? (reply.staffName || "Support Team") : "You"}
                    {reply.isStaff && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Staff</span>}
                  </span>
                  <span className="text-xs text-zinc-400">{new Date(reply.createdAt).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">{reply.body}</p>
              </div>
            ))}
            {ticket.replies.length === 0 && (
              <p className="text-sm text-zinc-400">No replies yet</p>
            )}
          </div>
        </div>

        {!ticket.status.isClosed && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Add a Reply</h3>
            <form onSubmit={handleReply}>
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                placeholder="Write your reply..."
                className="w-full rounded-lg border border-zinc-300 p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white dark:placeholder-zinc-500"
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !replyBody.trim()}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Sending..." : "Send Reply"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
