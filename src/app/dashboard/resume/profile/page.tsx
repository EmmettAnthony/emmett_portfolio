"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resumeProfileSchema, type ResumeProfileFormData,
} from "@/lib/validations/resume";
import { cn } from "@/lib/utils";
import {
  Save, Loader2, User, Plus, X, ArrowLeft, EyeOff
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

interface ResumeData {
  resume: ResumeProfileFormData & { id: string };
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [socialLinks, setSocialLinks] = useState<{ label: string; url: string }[]>([]);
  const [specializationsInput, setSpecializationsInput] = useState("");
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    awards: true,
    languages: true,
    references: true,
    featuredProjects: true,
  });

  const { data, isLoading, error } = useQuery<ResumeData>({
    queryKey: ["dashboard-resume-profile"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/profile");
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const form = useForm<ResumeProfileFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(resumeProfileSchema) as any,
    defaultValues: {
      fullName: "",
      professionalTitle: "",
      photo: null,
      location: null,
      yearsOfExperience: null,
      summary: null,
      summaryTitle: null,
      specializations: [],
      socialLinks: [],
      email: null,
      phone: null,
      website: null,
      template: "modern",
      metaTitle: null,
      metaDescription: null,
      ogImage: null,
      published: false,
    },
  });

  useEffect(() => {
    if (data?.resume) {
      const r = data.resume;
      form.reset({
        fullName: r.fullName,
        professionalTitle: r.professionalTitle,
        photo: r.photo ?? null,
        location: r.location ?? null,
        yearsOfExperience: r.yearsOfExperience ?? null,
        summary: r.summary ?? null,
        summaryTitle: r.summaryTitle ?? null,
        specializations: r.specializations ?? [],
        socialLinks: r.socialLinks ?? [],
        email: r.email ?? null,
        phone: r.phone ?? null,
        website: r.website ?? null,
        template: r.template ?? "modern",
        metaTitle: r.metaTitle ?? null,
        metaDescription: r.metaDescription ?? null,
        ogImage: r.ogImage ?? null,
        published: r.published ?? false,
      });
      setSocialLinks(r.socialLinks ?? []);
      setSpecializationsInput((r.specializations ?? []).join(", "));
      if (r.visibility && typeof r.visibility === "object") {
        setVisibility(r.visibility as Record<string, boolean>);
      }
    }
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: async (formData: ResumeProfileFormData) => {
      const res = await fetch("/api/dashboard/resume/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-profile"] });
      toast("success", "Profile saved");
    },
    onError: () => toast("error", "Failed to save profile"),
  });

  const onSubmit = (formData: ResumeProfileFormData) => {
    const specializations = specializationsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    saveMutation.mutate({
      ...formData,
      socialLinks,
      specializations,
      visibility,
    });
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { label: "", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSocialLinks(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <User className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load profile</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/resume">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Resume Profile</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage your personal information and resume settings</p>
          </div>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Profile
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" {...form.register("fullName")} placeholder="John Doe" />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalTitle">Professional Title</Label>
                <Input id="professionalTitle" {...form.register("professionalTitle")} placeholder="Full-Stack Developer" />
                {form.formState.errors.professionalTitle && (
                  <p className="text-xs text-red-500">{form.formState.errors.professionalTitle.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="photo">Photo URL</Label>
                <Input id="photo" {...form.register("photo")} placeholder="https://example.com/photo.jpg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" {...form.register("location")} placeholder="San Francisco, CA" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input
                  id="yearsOfExperience"
                  type="number"
                  {...form.register("yearsOfExperience", { valueAsNumber: true })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summaryTitle">Summary Title</Label>
              <Input id="summaryTitle" {...form.register("summaryTitle")} placeholder="About Me" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={5}
                {...form.register("summary")}
                placeholder="Write a professional summary..."
                className="min-h-[120px] resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} placeholder="john@example.com" />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} placeholder="+1 (555) 123-4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" {...form.register("website")} placeholder="https://johndoe.com" />
                {form.formState.errors.website && (
                  <p className="text-xs text-red-500">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Specializations */}
        <Card>
          <CardHeader>
            <CardTitle>Specializations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="specializations">Specializations (comma-separated)</Label>
              <Input
                id="specializations"
                value={specializationsInput}
                onChange={(e) => setSpecializationsInput(e.target.value)}
                placeholder="React, Node.js, TypeScript, UI/UX"
              />
              {specializationsInput && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {specializationsInput.split(",").map((s, i) => s.trim() && (
                    <span key={i} className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Social Links</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
                <Plus className="h-3 w-3" />
                Add Link
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {socialLinks.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No social links added yet.</p>
            )}
            {socialLinks.map((link, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Label (e.g. LinkedIn)"
                    value={link.label}
                    onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                  />
                  <Input
                    placeholder="URL (e.g. https://linkedin.com/in/johndoe)"
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeSocialLink(index)}
                  className="mt-2 rounded-md p-1.5 text-zinc-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Template & Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Template & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template">Template</Label>
              <Select
                value={form.watch("template")}
                onValueChange={(v: string | null) => v && form.setValue("template", v as ResumeProfileFormData["template"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform",
                    form.watch("published") ? "translate-x-[22px]" : "translate-x-[2px]"
                  )}
                />
              </button>
              <Label htmlFor="published">Published</Label>
            </div>
          </CardContent>
        </Card>

        {/* SEO */}
        <Card>
          <CardHeader>
            <CardTitle>SEO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" {...form.register("metaTitle")} placeholder="John Doe - Full-Stack Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                rows={3}
                {...form.register("metaDescription")}
                placeholder="Experienced full-stack developer..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImage">OG Image URL</Label>
              <Input id="ogImage" {...form.register("ogImage")} placeholder="https://example.com/og-image.jpg" />
            </div>
          </CardContent>
        </Card>

        {/* Section Visibility */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 text-zinc-500" />
              <CardTitle>Section Visibility</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "summary", label: "Professional Summary" },
              { key: "experience", label: "Work Experience" },
              { key: "education", label: "Education" },
              { key: "skills", label: "Technical Skills" },
              { key: "certifications", label: "Certifications" },
              { key: "awards", label: "Awards & Achievements" },
              { key: "languages", label: "Languages" },
              { key: "references", label: "References" },
              { key: "featuredProjects", label: "Featured Projects" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{label}</span>
                <Switch
                  checked={visibility[key as keyof typeof visibility]}
                  onCheckedChange={(checked) => setVisibility((prev) => ({ ...prev, [key]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
