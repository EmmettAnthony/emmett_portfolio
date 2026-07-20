"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { History, RotateCcw, Loader2 } from "lucide-react";

interface Revision {
  id: string;
  title: string;
  createdAt: string;
}

interface RevisionHistoryProps {
  postId: string;
  onRestore: (revisionId: string) => void;
}

export function RevisionHistory({ postId, onRestore }: RevisionHistoryProps) {

  const [open, setOpen] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const fetchRevisions = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
    });
    try {
      const res = await fetch(`/api/blog/${postId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setRevisions(data.revisions);
        });
      }
    } catch (err) {
      console.error("Failed to fetch revisions:", err);
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  }, [postId]);

  useEffect(() => {
    if (open) fetchRevisions();
  }, [open, fetchRevisions]);

  const handleRestore = async (revisionId: string) => {
    setRestoring(revisionId);
    try {
      const res = await fetch(`/api/blog/${postId}/revisions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      if (res.ok) {
        onRestore(revisionId);
      }
    } catch (err) {
      console.error("Failed to restore revision:", err);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Revision history"
      >
        <History className="h-4 w-4" />
        <span className="hidden sm:inline">History</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Revision History</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Close
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            ) : revisions.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-500">No revisions yet</p>
            ) : (
              <div className="space-y-1">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900 dark:text-white">
                        {rev.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(rev.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestore(rev.id)}
                      disabled={restoring === rev.id}
                      className="ml-2 shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-blue-600 disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-blue-400"
                      title="Restore this revision"
                    >
                      {restoring === rev.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
