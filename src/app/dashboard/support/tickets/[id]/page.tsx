"use client";

import { use, useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Loader2, Send, Lock, LockOpen, CheckCircle, User as UserIcon, ChevronDown, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Reply {
  id: string;
  body: string;
  author: { id: string; name: string };
  isInternal: boolean;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: { id: string; name: string } | null;
  customer: Customer;
  assignedTo: { id: string; name: string } | null;
  replies: Reply[];
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];


const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RESOLVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CLOSED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [replyBody, setReplyBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [macros, setMacros] = useState<Array<{ id: string; title: string; slug: string; body: string }>>([]);
  const [showMacros, setShowMacros] = useState(false);
  const macroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/support/macros").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setMacros(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (macroRef.current && !macroRef.current.contains(e.target as Node)) {
        setShowMacros(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: ticket, isLoading } = useQuery<TicketDetail>({
    queryKey: ["support-ticket", id],
    queryFn: async () => {
      const res = await fetch(`/api/support/tickets/${id}`);
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      setSelectedStatus(data.status);
      setSelectedAssignee(data.assignedTo?.id ?? "");
      return data;
    },
  });

  const { data: usersData } = useQuery<{ users: User[] }>({
    queryKey: ["support-users"],
    queryFn: async () => {
      const res = await fetch("/api/support/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ body, isInternal }: { body: string; isInternal: boolean }) => {
      const res = await fetch(`/api/support/tickets/${id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, isInternal }),
      });
      if (!res.ok) throw new Error("Failed to send reply");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast("success", "Reply sent");
      setReplyBody("");
      setIsInternal(false);
    },
    onError: () => toast("error", "Failed to send reply"),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/support/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast("success", "Status updated");
      setShowCloseConfirm(false);
    },
    onError: () => toast("error", "Failed to update status"),
  });

  const assignMutation = useMutation({
    mutationFn: async (assigneeId: string) => {
      const res = await fetch(`/api/support/tickets/${id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: assigneeId || null }),
      });
      if (!res.ok) throw new Error("Failed to assign ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast("success", "Ticket assigned");
    },
    onError: () => toast("error", "Failed to assign ticket"),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/support/tickets/${id}/close`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to close ticket");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast("success", "Ticket closed");
      setShowCloseConfirm(false);
    },
    onError: () => toast("error", "Failed to close ticket"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-zinc-500">
        Ticket not found.
      </div>
    );
  }

  const users = usersData?.users ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            &larr; Back to tickets
          </button>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {ticket.number}: {ticket.subject}
          </h2>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowCloseConfirm(true)}
          disabled={ticket.status === "CLOSED"}
        >
          <CheckCircle className="h-4 w-4" />
          Close Ticket
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {ticket.description}
              </p>
              <p className="mt-4 text-xs text-zinc-400">
                Created {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Replies ({ticket.replies.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.replies.length === 0 && (
                <p className="py-4 text-center text-sm text-zinc-500">No replies yet</p>
              )}
              {ticket.replies.map((reply) => (
                <div
                  key={reply.id}
                  className={cn(
                    "rounded-lg border p-4",
                    reply.isInternal
                      ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                      : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">
                        {reply.author.name}
                      </span>
                      {reply.isInternal && (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                          <Lock className="h-3 w-3 mr-1" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(reply.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {reply.body}
                  </p>
                </div>
              ))}

              <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-white">Add Reply</h4>
                  <button
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      isInternal
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    )}
                  >
                    {isInternal ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
                    {isInternal ? "Internal Note" : "Public Reply"}
                  </button>
                </div>
                <Textarea
                  placeholder={isInternal ? "Add an internal note..." : "Write your reply..."}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  rows={4}
                />
                <div className="mt-3 flex items-center justify-between">
                  <div ref={macroRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMacros(!showMacros)}
                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      <FileText className="h-3 w-3" /> Macro <ChevronDown className="h-3 w-3" />
                    </button>
                    {showMacros && (
                      <div className="absolute bottom-full left-0 mb-1 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 z-10">
                        <div className="p-1">
                          {macros.length === 0 && <p className="px-2 py-3 text-center text-xs text-zinc-400">No macros defined</p>}
                          {macros.map((macro) => (
                            <button
                              key={macro.id}
                              type="button"
                              onClick={() => {
                                setReplyBody(prev => prev + (prev ? "\n\n" : "") + macro.body);
                                setShowMacros(false);
                              }}
                              className="w-full rounded-md px-2 py-2 text-left text-xs hover:bg-zinc-100 dark:hover:bg-zinc-700"
                            >
                              <span className="font-medium text-zinc-900 dark:text-white">{macro.title}</span>
                              <span className="ml-2 text-zinc-400">({macro.slug})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => {
                      if (!replyBody.trim()) return;
                      replyMutation.mutate({ body: replyBody.trim(), isInternal });
                    }}
                    disabled={!replyBody.trim() || replyMutation.isPending}
                  >
                    {replyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Send className="h-4 w-4" />
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-500">Status</label>
                <Select
                  value={selectedStatus}
                    onValueChange={(value) => {
                    if (value) {
                      setSelectedStatus(value);
                      statusMutation.mutate(value);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        <span className={cn("inline-flex items-center gap-2", STATUS_STYLES[opt])}>
                          {opt.replace(/_/g, " ")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500">Priority</label>
                <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{ticket.priority}</p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500">Category</label>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {ticket.category?.name ?? "—"}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500">Assigned To</label>
                <Select
                  value={selectedAssignee}
                  onValueChange={(value) => {
                    if (value) {
                      setSelectedAssignee(value);
                      assignMutation.mutate(value);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1 w-full">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <span className="flex items-center gap-2">
                          <UserIcon className="h-3.5 w-3.5" />
                          {user.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{ticket.customer.name}</p>
              <p className="text-sm text-zinc-500">{ticket.customer.email}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Close Ticket</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to close ticket {ticket.number}? This will mark it as resolved.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCloseConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Close Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
