"use client";

import {
  useEffect
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";import type { AboutPageFormData } from "@/lib/validations/about";
import { aboutPageSchema } from "@/lib/validations/about";
import { Save, Loader2, User, ArrowLeft, Globe } from "lucide-react";
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
import type { AboutPageFormData } from "@/lib/validations/about";

interface AboutData {
  about: AboutPageFormData & { id: string };
}

export default function AboutProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<AboutData>({
    queryKey: ["dashboard-about"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/about");
      if (!res.ok) throw new Error("Failed to fetch about page");
      return res.json();
    },
  });

  const form = useForm<AboutPageFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(aboutPageSchema) as any,
    defaultValues: {
      fullName: "",
      professionalTitle: "",
      shortIntro: null,
      photo: null,
      resumeUrl: null,
      summaryHeading: null,
      shortBio: null,
      fullBiography: null,
      yearsOfExperience: null,
      missionStatement: null,
      visionStatement: null,
      ctaHeading: null,
      ctaDescription: null,
      ctaPrimaryButton: null,
      ctaPrimaryLink: null,
      ctaSecondaryButton: null,
      ctaSecondaryLink: null,
      ctaBackground: null,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
      canonicalUrl: null,
      ogImage: null,
      published: false,
      whyWorkWithMe: [],
      workProcess: [],
      personalInterests: [],
      socialLinks: [],
      faqs: [],
    },
  });

  useEffect(() => {
    if (data?.about) {
      const a = data.about;
      form.reset({
        fullName: a.fullName,
        professionalTitle: a.professionalTitle,
        shortIntro: a.shortIntro ?? null,
        photo: a.photo ?? null,
        resumeUrl: a.resumeUrl ?? null,
        summaryHeading: a.summaryHeading ?? null,
        shortBio: a.shortBio ?? null,
        fullBiography: a.fullBiography ?? null,
        yearsOfExperience: a.yearsOfExperience ?? null,
        missionStatement: a.missionStatement ?? null,
        visionStatement: a.visionStatement ?? null,
        ctaHeading: a.ctaHeading ?? null,
        ctaDescription: a.ctaDescription ?? null,
        ctaPrimaryButton: a.ctaPrimaryButton ?? null,
        ctaPrimaryLink: a.ctaPrimaryLink ?? null,
        ctaSecondaryButton: a.ctaSecondaryButton ?? null,
        ctaSecondaryLink: a.ctaSecondaryLink ?? null,
        ctaBackground: a.ctaBackground ?? null,
        metaTitle: a.metaTitle ?? null,
        metaDescription: a.metaDescription ?? null,
        metaKeywords: a.metaKeywords ?? null,
        canonicalUrl: a.canonicalUrl ?? null,
        ogImage: a.ogImage ?? null,
        published: a.published ?? false,
        whyWorkWithMe: a.whyWorkWithMe ?? [],
        workProcess: a.workProcess ?? [],
        personalInterests: a.personalInterests ?? [],
        socialLinks: a.socialLinks ?? [],
        faqs: a.faqs ?? [],
      });
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async (formData: AboutPageFormData) => {
      const res = await fetch("/api/dashboard/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save about page");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-about"] });
      toast("success", "About page saved");
    },
    onError: () => toast("error", "Failed to save about page"),
  });

  const onSubmit = (formData: AboutPageFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <User className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load about page</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/about">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Profile & Hero</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your hero section, professional summary, and CTA</p>
          </div>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input {...form.register("fullName")} placeholder="Emmett Anthony" />
              </div>
              <div className="space-y-2">
                <Label>Professional Title</Label>
                <Input {...form.register("professionalTitle")} placeholder="Professional Software Developer" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short Introduction</Label>
              <Textarea {...form.register("shortIntro")} rows={3} placeholder="Building scalable web applications..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Profile Photo</Label>
                <ImageUpload value={form.watch("photo") ?? ""} onChange={(url) => form.setValue("photo", url)} label="Profile" />
              </div>
              <div className="space-y-2">
                <Label>Resume Download URL</Label>
                <Input {...form.register("resumeUrl")} placeholder="https://example.com/resume.pdf" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        <Card>
          <CardHeader><CardTitle>Professional Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Summary Heading</Label>
                <Input {...form.register("summaryHeading")} placeholder="About Me" />
              </div>
              <div className="space-y-2">
                <Label>Years of Experience</Label>
                <Input type="number" {...form.register("yearsOfExperience", { valueAsNumber: true })} placeholder="10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short Bio</Label>
              <Textarea {...form.register("shortBio")} rows={4} placeholder="A brief introduction..." />
            </div>
            <div className="space-y-2">
              <Label>Full Biography (Rich Text)</Label>
              <Textarea {...form.register("fullBiography")} rows={8} placeholder="Detailed biography with formatting..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mission Statement</Label>
                <Textarea {...form.register("missionStatement")} rows={3} placeholder="My mission is to..." />
              </div>
              <div className="space-y-2">
                <Label>Vision Statement</Label>
                <Textarea {...form.register("visionStatement")} rows={3} placeholder="My vision is to..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card>
          <CardHeader><CardTitle>Call to Action</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>CTA Heading</Label>
              <Input {...form.register("ctaHeading")} placeholder="Let's Work Together" />
            </div>
            <div className="space-y-2">
              <Label>CTA Description</Label>
              <Textarea {...form.register("ctaDescription")} rows={3} placeholder="Have a project in mind?" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Button Text</Label>
                <Input {...form.register("ctaPrimaryButton")} placeholder="Start a Project" />
              </div>
              <div className="space-y-2">
                <Label>Primary Button Link</Label>
                <Input {...form.register("ctaPrimaryLink")} placeholder="/contact" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Secondary Button Text</Label>
                <Input {...form.register("ctaSecondaryButton")} placeholder="Book Consultation" />
              </div>
              <div className="space-y-2">
                <Label>Secondary Button Link</Label>
                <Input {...form.register("ctaSecondaryLink")} placeholder="/booking" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CTA Background Image</Label>
              <ImageUpload value={form.watch("ctaBackground") ?? ""} onChange={(url) => form.setValue("ctaBackground", url)} label="CTA Background" />
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input {...form.register("metaTitle")} placeholder="About | Emmett Anthony" />
              </div>
              <div className="space-y-2">
                <Label>Meta Keywords</Label>
                <Input {...form.register("metaKeywords")} placeholder="software developer, web development" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea {...form.register("metaDescription")} rows={3} placeholder="Learn about Emmett Anthony..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Canonical URL</Label>
                <Input {...form.register("canonicalUrl")} placeholder="https://emmettanthony.dev/about" />
              </div>
              <div className="space-y-2">
                <Label>OG Image</Label>
                <ImageUpload value={form.watch("ogImage") ?? ""} onChange={(url) => form.setValue("ogImage", url)} label="OG" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Publishing */}
        <Card>
          <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={form.watch("published")}                    // eslint-disable-next-line react-hooks/incompatible-library
                    onClick={() => form.setValue("published", !form.watch("published"))}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  form.watch("published") ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                  form.watch("published") ? "translate-x-[22px]" : "translate-x-[2px]"
                )} />
              </button>
              <Label>Published</Label>
              {form.watch("published") && (
                <Link href="/about" target="_blank" className="ml-2 text-xs text-blue-600 hover:underline dark:text-blue-400">
                  <Globe className="mr-1 inline h-3 w-3" />
                  View live page
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
