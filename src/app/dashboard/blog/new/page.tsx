"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Editor } from "@tiptap/react";
import {
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { MediaBrowser } from "@/components/dashboard/RichTextEditor/media-browser";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";

const AUTOSAVE_KEY = "blog-editor-draft";
const AUTOSAVE_INTERVAL = 30000; // 30 seconds

export default function NewBlogPost() {
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [published, setPublished] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const { startUpload: startImageUpload } = useUploadThing("imageUploader");

  const handleSave = useCallback(async (publish?: boolean) => {
    setSaving(true);
    try {
      const body = {
        title,
        slug,
        excerpt,
        content,
        category: category || null,
        tags: tags ? tags.split(",").map((t: string) => t.trim()) : [],
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        image: featuredImage,
        published: publish !== undefined ? publish : published,
      };

      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.removeItem(AUTOSAVE_KEY);
        setLastSaved(new Date());
        router.push(`/dashboard/blog/${data.id}/edit`);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }, [title, slug, excerpt, content, category, tags, metaTitle, metaDescription, featuredImage, published, router]);

  // Restore draft from localStorage
  useEffect(() => {
    try {
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft) {
        /* eslint-disable react-hooks/set-state-in-effect */
        const data = JSON.parse(draft);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.excerpt) setExcerpt(data.excerpt);
        if (data.category) setCategory(data.category);
        if (data.tags) setTags(data.tags);
        if (data.slug) setSlug(data.slug);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    if (!title && !content) return;
    const timer = setInterval(() => {
      const draft = { title, content, excerpt, category, tags, slug };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
      setLastSaved(new Date());
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [title, content, excerpt, category, tags, slug]);

  // Save on Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleFeaturedImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImageUploading(true);
      try {
        const res = await startImageUpload([file]);
        if (res?.[0]?.url) {
          setFeaturedImage(res[0].url);
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
      } finally {
        setImageUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard/blog")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </button>
        <div className="flex items-center gap-3">
          {lastSaved && (
            <span className="text-xs text-zinc-500">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => handleSave()}
            disabled={saving || !title}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !title}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main editor */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full border-0 border-b border-transparent bg-transparent px-0 pb-2 text-2xl font-bold text-zinc-900 placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-muted-foreground"
          />

          {/* Rich text editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your post..."
            editorRef={editorRef}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                >
                  <option value="">Select category</option>
                  {BLOG_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="react, nextjs, typescript"
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Status</label>
                <div className="flex items-center gap-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800">
                  {published ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="text-sm text-zinc-700 dark:text-muted-foreground">
                    {published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured image */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Featured Image</h3>
            <div className="flex gap-2">
              <button
                onClick={handleFeaturedImage}
                disabled={imageUploading}
                className="flex flex-1 flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-6 text-sm text-zinc-500 transition-all hover:border-blue-500/50 hover:text-blue-600 disabled:opacity-50 dark:border-zinc-700 dark:hover:border-blue-400/50"
              >
                {imageUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
                {imageUploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => setShowMediaBrowser(true)}
                className="flex flex-1 flex-col items-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 p-6 text-sm text-zinc-500 transition-all hover:border-blue-500/50 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-400/50"
              >
                <ImageIcon className="h-6 w-6" />
                Browse Media
              </button>
            </div>
            {featuredImage && (
              <div className="mt-3 relative aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100">
                <Image src={featuredImage} alt="Featured" fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          {showMediaBrowser && (
            <MediaBrowser
              onSelect={(url) => { setFeaturedImage(url); setShowMediaBrowser(false); }}
              onClose={() => setShowMediaBrowser(false)}
            />
          )}

          {/* SEO */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title (optional)"
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Meta Description</label>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="SEO description (optional)"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">Excerpt</h3>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary of your post..."
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
