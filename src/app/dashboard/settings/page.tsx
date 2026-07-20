"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, Star } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    siteName: "", tagline: "", logo: "", favicon: "",
    email: "", phone: "", address: "", social: "", navigationLinks: "", integrations: "",
  });
  const [testimonialSettings, setTestimonialSettings] = useState({
    enabled: true,
    layout: "grid",
    columns: 2,
    limit: 6,
    title: "What Our Clients Say",
    subtitle: "Trusted by businesses and startups to deliver exceptional results.",
    pageShowSingleFeatured: true,
    pageShowCarousel: true,
    pageShowGrid: true,
    pageShowMasonry: true,
    pageGridColumns: 3,
  });
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      return res.json();
    },
  });

  const initForm = useCallback(() => {
    if (settings?.id) {
      setForm({
        siteName: settings.siteName ?? "",
        tagline: settings.tagline ?? "",
        logo: settings.logo ?? "",
        favicon: settings.favicon ?? "",
        email: settings.email ?? "",
        phone: settings.phone ?? "",
        address: settings.address ?? "",
        social: settings.social ?? "",
        navigationLinks: settings.navigationLinks ?? "",
        integrations: settings.integrations ?? "",
      });
      try {
        const parsed = JSON.parse(settings.integrations || "{}");
        if (parsed.testimonials) {
          setTestimonialSettings((prev) => ({ ...prev, ...parsed.testimonials }));
        }
      } catch {}
    }
  }, [settings]);

  useEffect(() => { const t = setTimeout(initForm, 0); return () => clearTimeout(t); }, [initForm]);

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let integrations = {};
    try {
      integrations = JSON.parse(form.integrations || "{}");
    } catch {}
    (integrations as Record<string, unknown>).testimonials = testimonialSettings;
    const navigationLinks = form.navigationLinks;
    mutation.mutate({ ...form, navigationLinks, integrations: JSON.stringify(integrations) });
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Site Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">Manage your site configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">General</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Site Name</label>
              <input type="text" value={form.siteName} onChange={(e) => updateField("siteName", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Tagline</label>
              <input type="text" value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Logo URL</label>
              <input type="url" value={form.logo} onChange={(e) => updateField("logo", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Favicon URL</label>
              <input type="url" value={form.favicon} onChange={(e) => updateField("favicon", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Address</label>
            <textarea value={form.address} onChange={(e) => updateField("address", e.target.value)} rows={3} className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Social & Integrations</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Social Links (JSON)</label>
              <textarea value={form.social} onChange={(e) => updateField("social", e.target.value)} rows={3} placeholder='{"github":"https://github.com/..."}' className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Navigation Links (JSON)</label>
              <textarea value={form.navigationLinks} onChange={(e) => updateField("navigationLinks", e.target.value)} rows={3} placeholder='[{"label":"Home","href":"/"},{"label":"About","href":"/about"}]' className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Integrations (JSON)</label>
              <textarea value={form.integrations} onChange={(e) => updateField("integrations", e.target.value)} rows={3} placeholder='{"googleAnalytics":"G-..."}' className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
          </div>
        </div>

        {/* Testimonials Settings */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" /> Testimonials Display
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Configure how testimonials appear on the homepage and /testimonials page.</p>
          <div className="mt-4 space-y-4">
            <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Homepage</h4>
            <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-muted-foreground">
              <input type="checkbox" checked={testimonialSettings.enabled}
                onChange={(e) => setTestimonialSettings({ ...testimonialSettings, enabled: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
              Show testimonials on homepage
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Layout</label>
                <select value={testimonialSettings.layout}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, layout: e.target.value as "grid" | "carousel" | "masonry" | "single" })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                  <option value="grid">Grid</option>
                  <option value="masonry">Masonry</option>
                  <option value="single">Single Featured</option>
                  <option value="carousel">Carousel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Columns</label>
                <select value={testimonialSettings.columns}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, columns: Number(e.target.value) as 2 | 3 | 4 })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                  <option value={2}>2 Columns</option>
                  <option value={3}>3 Columns</option>
                  <option value={4}>4 Columns</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Limit</label>
                <input type="number" min={1} max={20} value={testimonialSettings.limit}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, limit: Number(e.target.value) })}
                  className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Section Title</label>
              <input type="text" value={testimonialSettings.title}
                onChange={(e) => setTestimonialSettings({ ...testimonialSettings, title: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Section Subtitle</label>
              <input type="text" value={testimonialSettings.subtitle}
                onChange={(e) => setTestimonialSettings({ ...testimonialSettings, subtitle: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />
            <h4 className="pt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">/testimonials Page Sections</h4>
            <p className="text-xs text-zinc-500">Toggle which layout sections appear on the public testimonials page.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-muted-foreground">
                <input type="checkbox" checked={testimonialSettings.pageShowSingleFeatured}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, pageShowSingleFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                Single Featured Hero
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-muted-foreground">
                <input type="checkbox" checked={testimonialSettings.pageShowCarousel}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, pageShowCarousel: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                Carousel (Client Stories)
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-muted-foreground">
                <input type="checkbox" checked={testimonialSettings.pageShowGrid}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, pageShowGrid: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                Grid (All Reviews)
              </label>
              <label className="flex items-center gap-3 text-sm text-zinc-700 dark:text-muted-foreground">
                <input type="checkbox" checked={testimonialSettings.pageShowMasonry}
                  onChange={(e) => setTestimonialSettings({ ...testimonialSettings, pageShowMasonry: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                Masonry (Testimonial Wall)
              </label>
            </div>
            <div className="sm:w-1/2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground">Grid Columns</label>
              <select value={testimonialSettings.pageGridColumns}
                onChange={(e) => setTestimonialSettings({ ...testimonialSettings, pageGridColumns: Number(e.target.value) as 2 | 3 | 4 })}
                className="mt-1.5 w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved successfully!</span>}
          <button type="submit" disabled={mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}
