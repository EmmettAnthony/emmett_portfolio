"use client";

import {
  useEffect
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { HomepageFormData } from "@/lib/validations/homepage";
import {
  homepageSchema
} from "@/lib/validations/homepage";
import {
  Save,
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
import { cn } from "@/lib/utils";
import type { HomepageFormData } from "@/lib/validations/homepage";

export default function HomeHeroPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type assertion for external lib
  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard-homepage"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/home");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const form = useForm<HomepageFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type compat
    resolver: zodResolver(homepageSchema) as any,
    defaultValues: { heroHeadline: "", heroHighlight: null, heroSubheadline: null, heroDescription: null, heroImage: null, heroBackground: null, heroPrimaryCta: "Hire Me", heroPrimaryLink: "/contact", heroSecondaryCta: "View Portfolio", heroSecondaryLink: "/portfolio", heroResumeCta: null, heroResumeLink: null, statsTitle: null, statsSubtitle: null, statsEnabled: true, whyChooseTitle: null, whyChooseSubtitle: null, whyChooseItems: [], processTitle: null, processSubtitle: null, processSteps: [], projectsTitle: null, projectsSubtitle: null, projectsEnabled: true, projectsCount: 6, layout: "grid", testimonialsTitle: null, testimonialsSubtitle: null, testimonialsEnabled: true, testimonialsCount: 6, testimonialLayout: "grid", servicesTitle: null, servicesSubtitle: null, blogTitle: null, blogSubtitle: null, blogEnabled: true, blogCount: 3, certTitle: null, certSubtitle: null, certEnabled: true, faqTitle: null, faqSubtitle: null, faqs: [], faqEnabled: true, newsletterTitle: null, newsletterDesc: null, newsletterEnabled: true, ctaTitle: null, ctaDescription: null, ctaBackground: null, ctaPrimaryButton: "Get in Touch", ctaPrimaryLink: "/contact", ctaSecondaryButton: null, ctaSecondaryLink: null, ctaEnabled: true, metaTitle: null, metaDescription: null, metaKeywords: null, canonicalUrl: null, ogImage: null, published: true },
  });

  useEffect(() => {
    if (data?.homepage) {
      const h = data.homepage;
      form.reset({
        heroHeadline: h.heroHeadline, heroHighlight: h.heroHighlight ?? null, heroSubheadline: h.heroSubheadline ?? null,
        heroDescription: h.heroDescription ?? null, heroImage: h.heroImage ?? null, heroBackground: h.heroBackground ?? null,
        heroPrimaryCta: h.heroPrimaryCta ?? "Hire Me", heroPrimaryLink: h.heroPrimaryLink ?? "/contact",
        heroSecondaryCta: h.heroSecondaryCta ?? "View Portfolio", heroSecondaryLink: h.heroSecondaryLink ?? "/portfolio",
        heroResumeCta: h.heroResumeCta ?? null, heroResumeLink: h.heroResumeLink ?? null,
        statsTitle: h.statsTitle ?? null, statsSubtitle: h.statsSubtitle ?? null, statsEnabled: h.statsEnabled ?? true,
        whyChooseTitle: h.whyChooseTitle ?? null, whyChooseSubtitle: h.whyChooseSubtitle ?? null, whyChooseItems: h.whyChooseItems ?? [],
        processTitle: h.processTitle ?? null, processSubtitle: h.processSubtitle ?? null, processSteps: h.processSteps ?? [],
        projectsTitle: h.projectsTitle ?? null, projectsSubtitle: h.projectsSubtitle ?? null, projectsEnabled: h.projectsEnabled ?? true, projectsCount: h.projectsCount ?? 6, layout: h.layout ?? "grid",
        testimonialsTitle: h.testimonialsTitle ?? null, testimonialsSubtitle: h.testimonialsSubtitle ?? null, testimonialsEnabled: h.testimonialsEnabled ?? true, testimonialsCount: h.testimonialsCount ?? 6, testimonialLayout: h.testimonialLayout ?? "grid",
        servicesTitle: h.servicesTitle ?? null, servicesSubtitle: h.servicesSubtitle ?? null,
        blogTitle: h.blogTitle ?? null, blogSubtitle: h.blogSubtitle ?? null, blogEnabled: h.blogEnabled ?? true, blogCount: h.blogCount ?? 3,
        certTitle: h.certTitle ?? null, certSubtitle: h.certSubtitle ?? null, certEnabled: h.certEnabled ?? true,
        faqTitle: h.faqTitle ?? null, faqSubtitle: h.faqSubtitle ?? null, faqs: h.faqs ?? [], faqEnabled: h.faqEnabled ?? true,
        newsletterTitle: h.newsletterTitle ?? null, newsletterDesc: h.newsletterDesc ?? null, newsletterEnabled: h.newsletterEnabled ?? true,
        ctaTitle: h.ctaTitle ?? null, ctaDescription: h.ctaDescription ?? null, ctaBackground: h.ctaBackground ?? null,
        ctaPrimaryButton: h.ctaPrimaryButton ?? "Get in Touch", ctaPrimaryLink: h.ctaPrimaryLink ?? "/contact",
        ctaSecondaryButton: h.ctaSecondaryButton ?? null, ctaSecondaryLink: h.ctaSecondaryLink ?? null, ctaEnabled: h.ctaEnabled ?? true,
        metaTitle: h.metaTitle ?? null, metaDescription: h.metaDescription ?? null, metaKeywords: h.metaKeywords ?? null,
        canonicalUrl: h.canonicalUrl ?? null, ogImage: h.ogImage ?? null, published: h.published ?? true,
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async (formData: HomepageFormData) => {
      const res = await fetch("/api/dashboard/home", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", "Homepage saved"); },
    onError: () => toast("error", "Failed to save"),
  });

  const onSubmit = (formData: HomepageFormData) => saveMutation.mutate(formData);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Card><CardContent className="p-6 space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Hero & Settings</h1><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your hero section, layout, and content settings</p></div>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Main Headline</Label>
              <Input {...form.register("heroHeadline")} placeholder="Building Modern Software Solutions..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Highlight Text (optional)</Label>
                <Input {...form.register("heroHighlight")} placeholder="e.g. That Drive Business Growth" />
              </div>
              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input {...form.register("heroSubheadline")} placeholder="Professional Software Developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register("heroDescription")} rows={3} placeholder="Helping businesses create websites..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Primary CTA Text</Label>
                <Input {...form.register("heroPrimaryCta")} placeholder="Hire Me" />
              </div>
              <div className="space-y-2">
                <Label>Primary CTA Link</Label>
                <Input {...form.register("heroPrimaryLink")} placeholder="/contact" />
              </div>
              <div className="space-y-2">
                <Label>Resume CTA Text</Label>
                <Input {...form.register("heroResumeCta")} placeholder="Download Resume" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Secondary CTA Text</Label>
                <Input {...form.register("heroSecondaryCta")} placeholder="View Portfolio" />
              </div>
              <div className="space-y-2">
                <Label>Secondary CTA Link</Label>
                <Input {...form.register("heroSecondaryLink")} placeholder="/portfolio" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <ImageUpload value={form.watch("heroImage") ?? ""} onChange={(url) => form.setValue("heroImage", url)} label="Hero" />
              </div>
              <div className="space-y-2">
                <Label>Background Image/Video</Label>
                <ImageUpload value={form.watch("heroBackground") ?? ""} onChange={(url) => form.setValue("heroBackground", url)} label="BG" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Layouts */}
        <Card>
          <CardHeader><CardTitle>Layout Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Projects Layout</Label>
                <select {...form.register("layout")} className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <option value="grid">Grid</option>
                  <option value="carousel">Carousel</option>
                  <option value="masonry">Masonry</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Testimonial Layout</Label>
                <select {...form.register("testimonialLayout")} className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                  <option value="carousel">Carousel</option>
                  <option value="grid">Grid</option>
                  <option value="slider">Slider</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Blog Posts to Show</Label>
                <Input type="number" {...form.register("blogCount", { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Titles */}
        <Card>
          <CardHeader><CardTitle>Section Headings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Statistics Title</Label>
                <Input {...form.register("statsTitle")} placeholder="By the Numbers" />
              </div>
              <div className="space-y-2">
                <Label>Statistics Subtitle</Label>
                <Input {...form.register("statsSubtitle")} placeholder="A snapshot of my journey" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Services Title</Label>
                <Input {...form.register("servicesTitle")} placeholder="Services I Offer" />
              </div>
              <div className="space-y-2">
                <Label>Services Subtitle</Label>
                <Input {...form.register("servicesSubtitle")} placeholder="Professional services to help you grow" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Projects Title</Label>
                <Input {...form.register("projectsTitle")} placeholder="Featured Projects" />
              </div>
              <div className="space-y-2">
                <Label>Projects Subtitle</Label>
                <Input {...form.register("projectsSubtitle")} placeholder="A selection of my work" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Testimonials Title</Label>
                <Input {...form.register("testimonialsTitle")} placeholder="What Clients Say" />
              </div>
              <div className="space-y-2">
                <Label>Testimonials Subtitle</Label>
                <Input {...form.register("testimonialsSubtitle")} placeholder="Trusted by businesses" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Blog Title</Label>
                <Input {...form.register("blogTitle")} placeholder="Latest Articles" />
              </div>
              <div className="space-y-2">
                <Label>Blog Subtitle</Label>
                <Input {...form.register("blogSubtitle")} placeholder="Thoughts on web development" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <button type="button" role="switch" aria-checked={form.watch("published")}                    // eslint-disable-next-line react-hooks/incompatible-library
                    onClick={() => form.setValue("published", !form.watch("published"))}
                className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors", form.watch("published") ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700")}>
                <span className={cn("inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform", form.watch("published") ? "translate-x-[22px]" : "translate-x-[2px]")} />
              </button>
              <Label>Published</Label>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
