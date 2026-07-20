"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Image from "next/image";
import { Loader2, Search, Image as ImageIcon, X, ExternalLink, Trash2 } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  key: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

interface MediaBrowserProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export function MediaBrowser({ onSelect, onClose }: MediaBrowserProps) {

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    startTransition(() => {
      setLoading(true);
    });
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      startTransition(() => {
        setMedia(data.media || []);
      });
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      startTransition(() => {
        setLoading(false);
      });
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDelete = useCallback(async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeleting(item.id);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: [item.key] }),
      });
      if (res.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== item.id));
      }
    } catch (err) {
      console.error("Failed to delete media:", err);
    } finally {
      setDeleting(null);
    }
  }, []);

  const filtered = search
    ? media.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : media;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Media Library</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-zinc-200 px-5 py-3 dark:border-zinc-700">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search media..."
              className="w-full rounded-xl border border-zinc-300 bg-transparent py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">{search ? "No matching media" : "No media uploaded yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 transition-all hover:border-blue-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
                >
                  <button
                    onClick={() => onSelect(item.url)}
                    className="h-full w-full"
                  >
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 16vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
                      <p className="truncate text-xs text-white">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                    </div>
                    <div className="absolute right-1.5 top-1.5 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink className="h-3 w-3 text-white" />
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, item)}
                    disabled={deleting === item.id}
                    className="absolute bottom-1.5 right-1.5 rounded-full bg-red-600/80 p-1.5 text-white opacity-0 transition-all hover:bg-red-600 group-hover:opacity-100 disabled:opacity-100"
                    title="Delete"
                  >
                    {deleting === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
