"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import ImageUpload from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";

export default function HomeSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external lib
  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home"); if (!res.ok) throw new Error(); return res.json(); },
  });

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [published, setPublished] = useState(true);
  const [certTitle, setCertTitle] = useState("");
  const [certSubtitle, setCertSubtitle] = useState("");
  const [whyChooseTitle, setWhyChooseTitle] = useState("");
  const [whyChooseSubtitle, setWhyChooseSubtitle] = useState("");

  useEffect(() => {
    if (data?.homepage) {
      const timer = setTimeout(() => {
        const h = data.homepage;
        setMetaTitle(h.metaTitle ?? "");
        setMetaDesc(h.metaDescription ?? "");
        setMetaKeywords(h.metaKeywords ?? "");
        setCanonicalUrl(h.canonicalUrl ?? "");
        setOgImage(h.ogImage ?? "");
        setPublished(h.published ?? true);
        setCertTitle(h.certTitle ?? "");
        setCertSubtitle(h.certSubtitle ?? "");
        setWhyChooseTitle(h.whyChooseTitle ?? "");
        setWhyChooseSubtitle(h.whyChooseSubtitle ?? "");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const d = await (await fetch("/api/dashboard/home")).json();
      const h = d.homepage;
      const res = await fetch("/api/dashboard/home", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...h, metaTitle, metaDescription: metaDesc, metaKeywords, canonicalUrl, ogImage, published, certTitle, certSubtitle, whyChooseTitle, whyChooseSubtitle }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", "Saved"); },
    onError: () => toast("error", "Failed"),
  });

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">Settings & SEO</h1><p className="mt-1 text-sm text-zinc-500">Manage SEO, publishing, and section settings</p></div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Meta Title</Label><Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="Emmett Anthony - Software Developer" /></div>
            <div className="space-y-2"><Label>Meta Keywords</Label><Input value={metaKeywords} onChange={(e) => setMetaKeywords(e.target.value)} placeholder="software developer, web development" /></div>
          </div>
          <div className="space-y-2"><Label>Meta Description</Label><Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Canonical URL</Label><Input value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder="https://emmettanthony.dev" /></div>
            <div className="space-y-2"><Label>OG Image</Label><ImageUpload value={ogImage} onChange={(url) => setOgImage(url)} label="OG" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Section Headings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Why Choose Me Title</Label><Input value={whyChooseTitle} onChange={(e) => setWhyChooseTitle(e.target.value)} placeholder="Why Choose Me" /></div>
            <div className="space-y-2"><Label>Why Choose Me Subtitle</Label><Input value={whyChooseSubtitle} onChange={(e) => setWhyChooseSubtitle(e.target.value)} placeholder="What sets me apart" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Certifications Title</Label><Input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Certifications & Achievements" /></div>
            <div className="space-y-2"><Label>Certifications Subtitle</Label><Input value={certSubtitle} onChange={(e) => setCertSubtitle(e.target.value)} placeholder="Credentials that validate my expertise" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <button type="button" role="switch" aria-checked={published}
              onClick={() => setPublished(!published)}
              className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors", published ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700")}>
              <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform", published ? "translate-x-[22px]" : "translate-x-[2px]")} />
            </button>
            <Label>Published</Label>
            {published && <Link href="/" target="_blank" className="ml-2 text-xs text-blue-600 hover:underline"><Globe className="mr-1 inline h-3 w-3" />View live</Link>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
