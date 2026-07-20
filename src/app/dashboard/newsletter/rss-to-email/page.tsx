"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Rss, Send, Eye, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";

export default function RssToEmailPage() {

  const { toast } = useToast();
  const [feedUrl, setFeedUrl] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [previewItems, setPreviewItems] = useState<{ title: string; link: string; description: string; pubDate: string }[] | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/newsletter/rss-to-email?url=${encodeURIComponent(feedUrl)}`);
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    onSuccess: (data) => {
      setPreviewItems(data.items);
      if (data.items.length === 0) toast("error", "No items found in feed");
      else toast("success", `Found ${data.items.length} items`);
    },
    onError: () => toast("error", "Failed to preview feed — check the URL"),
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/newsletter/rss-to-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl, campaignName, subjectLine }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      toast("success", `RSS digest sent to ${data.sent} subscribers`);
      setPreviewItems(null);
    },
    onError: (err: Error) => toast("error", err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">RSS to Email</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Convert an RSS feed into a newsletter campaign and send it to all active subscribers
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Feed Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">RSS Feed URL</label>
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://example.com/feed.xml"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Campaign Name (optional)</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder={`RSS Digest: ${new Date().toLocaleDateString()}`}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500">Subject Line (optional, defaults to latest item title)</label>
                <input
                  type="text"
                  value={subjectLine}
                  onChange={(e) => setSubjectLine(e.target.value)}
                  placeholder="Latest Updates"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => previewMutation.mutate()}
                  disabled={!feedUrl.trim() || previewMutation.isPending}
                  className="flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  Preview Feed
                </button>
                <button
                  onClick={() => sendMutation.mutate()}
                  disabled={!feedUrl.trim() || sendMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send to All Subscribers
                </button>
              </div>
            </div>
          </div>

          {!previewItems ? (
            <EmptyState
              icon={Rss}
              title="No feed preview"
              description="Enter an RSS feed URL and click Preview Feed to see items."
            />
          ) : previewItems.length === 0 ? (
            <EmptyState
              icon={Rss}
              title="No items found"
              description="The feed returned no items. Check the URL and try again."
            />
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Preview ({previewItems.length} items)
                </h3>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {previewItems.map((item, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{item.description}</p>
                        <p className="mt-1 text-xs text-zinc-400">{new Date(item.pubDate).toLocaleDateString()}</p>
                      </div>
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 mb-4">
            <Rss className="h-4 w-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">How it works</h2>
          </div>
          <ol className="space-y-3 text-sm text-muted-foreground dark:text-zinc-400">
            <li className="flex gap-2"><span className="font-bold text-zinc-900 dark:text-white">1.</span> Enter your RSS feed URL</li>
            <li className="flex gap-2"><span className="font-bold text-zinc-900 dark:text-white">2.</span> Preview the latest items</li>
            <li className="flex gap-2"><span className="font-bold text-zinc-900 dark:text-white">3.</span> Click send to create a campaign and email all active subscribers</li>
          </ol>
          <p className="mt-4 text-xs text-zinc-400">The email will be formatted with each feed item as a linked headline with description.</p>
        </div>
      </div>
    </div>
  );
}
