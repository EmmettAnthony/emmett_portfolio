"use client";

import { useState, useRef, useCallback, useEffect, use } from "react";
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
  Calendar,
} from "lucide-react";
import { RichTextEditor } from "@/components/dashboard/RichTextEditor";
import { MediaBrowser } from "@/components/dashboard/RichTextEditor/media-browser";
import { RevisionHistory } from "@/components/dashboard/RichTextEditor/revision-history";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { BLOG_CATEGORIES } from "@/lib/blog-categories";

const AUTOSAVE_KEY_PREFIX = "blog-editor-";
const AUTOSAVE_INTERVAL = 30000;

export default function EditBlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const editorRef = useRef<Editor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  const { startUpload: startImageUpload } = useUploadThing("imageUploader");

  const autosaveKey = `${AUTOSAVE_KEY_PREFIX}${id}`;

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

      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        localStorage.removeItem(autosaveKey);
        setLastSaved(new Date());
        if (publish !== undefined) setPublished(publish);
      }
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }, [id, title, slug, excerpt, content, category, tags, metaTitle, metaDescription, featuredImage, published, autosaveKey]);

  const handleAutoSave = useCallback(async () => {
    if (!title && !content) return;
    setAutoSaving(true);
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
        published,
      };
      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        localStorage.removeItem(autosaveKey);
        setLastSaved(new Date());
      }
    } catch {
      // Silent fail for auto-save
    } finally {
      setAutoSaving(false);
    }
  }, [id, title, slug, excerpt, content, category, tags, metaTitle, metaDescription, featuredImage, published, autosaveKey]);

  const handleRestoreRevision = useCallback(async (revisionId: string) => {
    try {
      const res = await fetch(`/api/blog/${id}/revisions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId }),
      });
      if (res.ok) {
        const data = await res.json();
        const post = data.post;
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content || "");
        setCategory(post.category || "");
        setTags(post.tags ? JSON.parse(post.tags).join(", ") : "");
        setMetaTitle(post.metaTitle || "");
        setMetaDescription(post.metaDescription || "");
        setFeaturedImage(post.image || null);
        setPublished(post.published);
      }
    } catch (err) {
      console.error("Failed to restore revision:", err);
    }
  }, [id]);

  // Fetch post data
  useEffect(() => {
    async function loadPost() {
      try {
        const res = await fetch(`/api/blog/${id}`);
        if (!res.ok) {
          if (res.status === 404) setNotFound(true);
          return;
        }
        const data = await res.json();
        const post = data.post;
        setTitle(post.title);
        setSlug(post.slug);
        setExcerpt(post.excerpt || "");
        setContent(post.content || "");
        setCategory(post.category || "");
        setTags(post.tags ? JSON.parse(post.tags).join(", ") : "");
        setMetaTitle(post.metaTitle || "");
        setMetaDescription(post.metaDescription || "");
        setFeaturedImage(post.image || null);
        setPublished(post.published);
        setPublishedAt(post.publishedAt);
      } catch (err) {
        console.error("Failed to load post:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  // Restore unsaved draft from localStorage
  useEffect(() => {
    if (loading) return;
    try {
      const draft = localStorage.getItem(autosaveKey);
      if (draft) {
        /* eslint-disable react-hooks/set-state-in-effect */
        const data = JSON.parse(draft);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.excerpt) setExcerpt(data.excerpt);
        if (data.category) setCategory(data.category);
        if (data.tags) setTags(data.tags);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch {}
  }, [loading, autosaveKey]);

  // Autosave to server
  useEffect(() => {
    if (loading) return;
    if (!title && !content) return;
    const timer = setInterval(() => {
      handleAutoSave();
    }, AUTOSAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [loading, title, content, handleAutoSave]);

  // Ctrl+S
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      if (res.ok) {
        localStorage.removeItem(autosaveKey);
        router.push("/dashboard/blog");
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-zinc-500">Post not found</p>
        <button
          onClick={() => router.push("/dashboard/blog")}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Back to blog
        </button>
      </div>
    );
  }

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
              {autoSaving ? "Saving..." : `Saved ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          <RevisionHistory postId={id} onRestore={handleRestoreRevision} />
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-300 px-4 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
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
            Save
          </button>
          <button
            onClick={() => handleSave(!published)}
            disabled={saving || !title}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
            {published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Delete permanently
            </button>
            <button
              onClick={() => setShowDelete(false)}
              className="inline-flex h-8 items-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main editor */}
        <div className="space-y-6 lg:col-span-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full border-0 border-b border-transparent bg-transparent px-0 pb-2 text-2xl font-bold text-zinc-900 placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-0 dark:text-white dark:placeholder:text-muted-foreground"
          />

          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Continue writing..."
            editorRef={editorRef}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Slug</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Category</label>
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
                <label className="mb-1 block text-xs font-medium text-zinc-500">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="react, nextjs, typescript"
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
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
                {publishedAt && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="h-3 w-3" />
                    Published {new Date(publishedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Featured image */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Featured Image</h3>
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
              <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100">
                <Image src={featuredImage} alt="Featured" fill className="object-cover" sizes="(max-width: 768px) 100vw, 300px" />
                <button
                  onClick={() => setFeaturedImage(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
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
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Meta Title</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="SEO title (optional)"
                  className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500">Meta Description</label>
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
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Excerpt</h3>
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
