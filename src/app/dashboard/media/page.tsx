"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Upload, Search, Loader2, CheckCircle2 } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing-client";

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  async function fetchMedia() {
    try {
      const res = await fetch("/api/media");
      if (res.ok) {
        const data = await res.json();
        setMedia(data.media);
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = media.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <UploadButton
          endpoint="mediaUploader"
          onClientUploadComplete={() => fetchMedia()}
          onUploadError={(err) => console.error("Upload failed:", err)}
          appearance={{
            button:
              "inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
          }}
          content={{
            button({ ready }) {
              return ready ? (
                <>
                  <Upload className="h-4 w-4" /> Upload
                </>
              ) : (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </>
              );
            },
          }}
        />
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700">
          <Upload className="h-8 w-8 text-zinc-400" />
          <p className="text-sm text-zinc-500">
            {search ? "No media found" : "No media uploaded yet"}
          </p>
          {!search && (
            <p className="text-xs text-zinc-400">
              Upload images using the button above
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => copyUrl(item.url, item.id)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              title="Click to copy URL"
            >
              <Image
                src={item.url}
                alt={item.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                {copiedId === item.id ? (
                  <CheckCircle2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 opacity-0 transition-all group-hover:opacity-100 dark:bg-zinc-800/90 dark:text-muted-foreground">
                    Copy URL
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="truncate text-xs text-white">{item.name}</p>
                {item.size && (
                  <p className="text-[10px] text-white/70">
                    {formatSize(item.size)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
