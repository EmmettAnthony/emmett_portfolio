"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import ImageUpload from "@/components/ui/ImageUpload";

export default function HomeCtaPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external lib
  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home"); if (!res.ok) throw new Error(); return res.json(); },
  });

  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaDesc, setCtaDesc] = useState("");
  const [ctaBg, setCtaBg] = useState("");
  const [ctaPrimary, setCtaPrimary] = useState("Get in Touch");
  const [ctaPrimaryLink, setCtaPrimaryLink] = useState("/contact");
  const [ctaSecondary, setCtaSecondary] = useState("Book a Consultation");
  const [ctaSecondaryLink, setCtaSecondaryLink] = useState("/booking");
  const [newsletterTitle, setNewsletterTitle] = useState("Stay Updated");
  const [newsletterDesc, setNewsletterDesc] = useState("");

  useEffect(() => {
    if (data?.homepage) {
      const timer = setTimeout(() => {
        const h = data.homepage;
        setCtaTitle(h.ctaTitle ?? "");
        setCtaDesc(h.ctaDescription ?? "");
        setCtaBg(h.ctaBackground ?? "");
        setCtaPrimary(h.ctaPrimaryButton ?? "Get in Touch");
        setCtaPrimaryLink(h.ctaPrimaryLink ?? "/contact");
        setCtaSecondary(h.ctaSecondaryButton ?? "Book a Consultation");
        setCtaSecondaryLink(h.ctaSecondaryLink ?? "/booking");
        setNewsletterTitle(h.newsletterTitle ?? "Stay Updated");
        setNewsletterDesc(h.newsletterDesc ?? "");
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
        body: JSON.stringify({ ...h, ctaTitle, ctaDescription: ctaDesc, ctaBackground: ctaBg, ctaPrimaryButton: ctaPrimary, ctaPrimaryLink, ctaSecondaryButton: ctaSecondary, ctaSecondaryLink, newsletterTitle, newsletterDesc: newsletterDesc }),
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
          <div><h1 className="text-2xl font-bold">CTA & Newsletter</h1><p className="mt-1 text-sm text-zinc-500">Manage call-to-action and newsletter sections</p></div>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Save
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Call to Action Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Heading</Label><Input value={ctaTitle} onChange={(e) => setCtaTitle(e.target.value)} placeholder="Let's Work Together" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={ctaDesc} onChange={(e) => setCtaDesc(e.target.value)} rows={3} placeholder="Have a project in mind?" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Primary Button Text</Label><Input value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} placeholder="Get in Touch" /></div>
            <div className="space-y-2"><Label>Primary Button Link</Label><Input value={ctaPrimaryLink} onChange={(e) => setCtaPrimaryLink(e.target.value)} placeholder="/contact" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Secondary Button Text</Label><Input value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} placeholder="Book a Consultation" /></div>
            <div className="space-y-2"><Label>Secondary Button Link</Label><Input value={ctaSecondaryLink} onChange={(e) => setCtaSecondaryLink(e.target.value)} placeholder="/booking" /></div>
          </div>
          <div className="space-y-2"><Label>Background Image</Label><ImageUpload value={ctaBg} onChange={(url) => setCtaBg(url)} label="CTA BG" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Newsletter Section</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input value={newsletterTitle} onChange={(e) => setNewsletterTitle(e.target.value)} placeholder="Stay Updated" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={newsletterDesc} onChange={(e) => setNewsletterDesc(e.target.value)} rows={3} placeholder="Get the latest articles" /></div>
        </CardContent>
      </Card>
    </div>
  );
}
