"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, Plus, X, Save, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { createServiceSchema } from "@/lib/validations/services";
import { TestimonialSelector } from "@/components/services/TestimonialSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceCategory } from "@/types/services";
import ImageUpload from "@/components/ui/ImageUpload";
import { UploadButton } from "@/lib/uploadthing-client";

interface CategoriesResponse {
  categories: ServiceCategory[];
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

interface ServiceForm {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  icon: string;
  featuredImage: string;
  galleryImages: string[];
  features: string[];
  benefits: string[];
  technologies: string[];
  deliverables: string[];
  estimatedTimeline: string;
  startingPrice: string;
  featured: boolean;
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  tags: string[];
  testimonialIds: string[];
}

const defaultForm: ServiceForm = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  categoryId: "",
  icon: "",
  featuredImage: "",
  galleryImages: [],
  features: [],
  benefits: [],
  technologies: [],
  deliverables: [],
  estimatedTimeline: "",
  startingPrice: "",
  featured: false,
  published: false,
  metaTitle: "",
  metaDescription: "",
  ogImage: "",
  canonicalUrl: "",
  tags: [],
  testimonialIds: [],
};

function StringListInput({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setInput("");
    }
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 p-2 text-white hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-zinc-400 hover:text-red-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateServicePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<ServiceForm>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(createServiceSchema) as any,
    defaultValues: defaultForm,
    shouldUnregister: false,
  });
  const { register, handleSubmit, formState: { errors }, control, watch, setValue } = form;

  const watchTitle = watch("title");
  const watchSlug = watch("slug");

  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["dashboard-service-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const categories = categoriesData?.categories ?? [];

  const onTitleChange = useCallback((title: string) => {
    setValue("title", title);
    if (!watchSlug || watchSlug === slugify(watchTitle)) {
      setValue("slug", slugify(title));
    }
  }, [setValue, watchSlug, watchTitle]);

  const createMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch("/api/dashboard/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create service");
      return res.json();
    },
    onSuccess: () => {
      toast("success", "Service created");
      router.push("/dashboard/services");
    },
    onError: () => toast("error", "Failed to create service"),
  });

  const handleSave: SubmitHandler<ServiceForm> = (data) => {
    createMutation.mutate({
      ...data,
      startingPrice: data.startingPrice ? parseFloat(data.startingPrice) : null,
      shortDescription: data.shortDescription || null,
      fullDescription: data.fullDescription || null,
      icon: data.icon || null,
      featuredImage: data.featuredImage || null,
      estimatedTimeline: data.estimatedTimeline || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ogImage: data.ogImage || null,
      canonicalUrl: data.canonicalUrl || null,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Create Service</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Add a new service offering</p>
          </div>
        </div>
        <Button onClick={handleSubmit(handleSave)} disabled={createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Create Service
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-sm">Basic Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input {...register("title")} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Web Development" className={cn(errors.title && "border-red-400")} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>
              <div>
                <Label>Slug *</Label>
                <Input {...register("slug")} placeholder="web-development" className={cn("font-mono", errors.slug && "border-red-400")} />
                {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea {...register("shortDescription")} rows={3} placeholder="Brief description for listing cards" />
              </div>
              <div>
                <Label>Full Description</Label>
                <Textarea {...register("fullDescription")} rows={8} placeholder="Detailed description of the service" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select onValueChange={(v) => setValue("categoryId", v ?? "")} value={watch("categoryId")}>
                  <SelectTrigger className={cn("w-full", errors.categoryId && "border-red-400")}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Media</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Icon (emoji or short code)</Label>
                <Input {...register("icon")} placeholder="e.g. 🚀 or code-icon" />
              </div>
              <div>
                <Label>Featured Image</Label>
                <ImageUpload value={watch("featuredImage")} onChange={(url) => setValue("featuredImage", url)} endpoint="imageUploader" label="Featured" />
              </div>
              <div>
                <Label>Gallery Images</Label>
                <div className="mb-2">
                  <UploadButton
                    endpoint="mediaUploader"
                    onClientUploadComplete={(res) => {
                      if (res?.length) {
                        const current = watch("galleryImages") ?? []; // eslint-disable-line react-hooks/incompatible-library
                         
    setValue("galleryImages", [...current, ...res.map((r) => r.url)]);
                      }
                    }}
                    onUploadError={(err) => console.error("Upload failed:", err)}
                    appearance={{
                      button: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
                    }}
                    content={{
                      button({ ready }) {
                        return ready ? <><Upload className="h-4 w-4" /> Upload Images</> : "Loading...";
                      },
                    }}
                  />
                </div>
                <Controller
                  control={control}
                  name="galleryImages"
                  render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add image URL..." />}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Features & Benefits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Features</Label>
                <Controller
                  control={control}
                  name="features"
                  render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add a feature..." />}
                />
              </div>
              <div>
                <Label>Benefits</Label>
                <Controller
                  control={control}
                  name="benefits"
                  render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add a benefit..." />}
                />
              </div>
              <div>
                <Label>Technologies</Label>
                <Controller
                  control={control}
                  name="technologies"
                  render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add a technology..." />}
                />
              </div>
              <div>
                <Label>Deliverables</Label>
                <Controller
                  control={control}
                  name="deliverables"
                  render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add a deliverable..." />}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Pricing & Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Starting Price ($)</Label>
                <Input type="number" min={0} {...register("startingPrice")} placeholder="e.g. 999" />
              </div>
              <div>
                <Label>Estimated Timeline</Label>
                <Input {...register("estimatedTimeline")} placeholder="e.g. 2-4 weeks" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch("featured")}
                  onChange={(e) => setValue("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Featured</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={watch("published")}
                  onChange={(e) => setValue("published", e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">Published</span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => <StringListInput items={field.value} onChange={field.onChange} placeholder="Add a tag..." />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Testimonials</CardTitle></CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="testimonialIds"
                render={({ field }) => <TestimonialSelector selectedIds={field.value} onChange={field.onChange} />}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Meta Title</Label>
                <Input {...register("metaTitle")} placeholder="SEO title" />
              </div>
              <div>
                <Label>Meta Description</Label>
                <Textarea {...register("metaDescription")} rows={3} placeholder="SEO description" />
              </div>
              <div>
                <Label>OG Image</Label>
                <ImageUpload value={watch("ogImage")} onChange={(url) => setValue("ogImage", url)} endpoint="imageUploader" label="OG" />
              </div>
              <div>
                <Label>Canonical URL</Label>
                <Input {...register("canonicalUrl")} placeholder="https://example.com/services/my-service" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
