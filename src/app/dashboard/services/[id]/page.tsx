"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, ArrowLeft, Save, Trash2, Plus, X, Layers, Eye, Star, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createServicePackageSchema,
  createServiceFaqSchema
} from "@/lib/validations/services";
import { TestimonialSelector } from "@/components/services/TestimonialSelector";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUpload from "@/components/ui/ImageUpload";
import { UploadButton } from "@/lib/uploadthing-client";
import type {
  Service,
  ServicePackage,
  ServiceCategory
} from "@/types/services";

interface CategoriesResponse { categories: ServiceCategory[] }

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        <button type="button" onClick={add} className="rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 p-2 text-white hover:from-brand-500 hover:to-brand-600"><Plus className="h-4 w-4" /></button>
      </div>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground">
              {item}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-zinc-400 hover:text-red-500"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const serviceFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Must be a valid slug"),
  shortDescription: z.string().optional().default(""),
  fullDescription: z.string().optional().default(""),
  categoryId: z.string().min(1, "Category is required"),
  icon: z.string().optional().default(""),
  featuredImage: z.string().optional().default(""),
  galleryImages: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  deliverables: z.array(z.string()).optional().default([]),
  estimatedTimeline: z.string().optional().default(""),
  startingPrice: z.string().optional().default(""),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  metaTitle: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  ogImage: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  testimonialIds: z.array(z.string()).optional().default([]),
});

type ServiceForm = z.input<typeof serviceFormSchema>;

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const id = params.id as string;
  const [showDelete, setShowDelete] = useState(false);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [editPackage, setEditPackage] = useState<ServicePackage | null>(null);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: "", slug: "", shortDescription: "", fullDescription: "", categoryId: "", icon: "",
      featuredImage: "", galleryImages: [], features: [], benefits: [], technologies: [], deliverables: [],
      estimatedTimeline: "", startingPrice: "", featured: false, published: false, metaTitle: "", metaDescription: "", ogImage: "", canonicalUrl: "", tags: [],
      testimonialIds: [],
    },
  });
  const { register, handleSubmit, formState: { errors }, control, watch, setValue, reset } = form;

  // Package form state
  const [pkgForm, setPkgForm] = useState({ name: "", description: "", price: "", features: [] as string[], deliveryTime: "", revisions: 0, supportDuration: "", isPopular: false, order: 0 });
  const [pkgFormErrors, setPkgFormErrors] = useState<Record<string, string>>({});

  // FAQ form state
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", order: 0 });
  const [faqFormErrors, setFaqFormErrors] = useState<Record<string, string>>({});

  const { data: service, isLoading, error } = useQuery<Service>({
    queryKey: ["dashboard-service", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/services/${id}`);
      if (!res.ok) throw new Error("Failed to fetch service");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery<CategoriesResponse>({
    queryKey: ["dashboard-service-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/services/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const categories = categoriesData?.categories ?? [];

  useEffect(() => {
    if (service) {
      reset({
        title: service.title || "",
        slug: service.slug || "",
        shortDescription: service.shortDescription || "",
        fullDescription: service.fullDescription || "",
        categoryId: service.categoryId || "",
        icon: service.icon || "",
        featuredImage: service.featuredImage || "",
        galleryImages: service.galleryImages || [],
        features: service.features || [],
        benefits: service.benefits || [],
        technologies: service.technologies || [],
        deliverables: service.deliverables || [],
        estimatedTimeline: service.estimatedTimeline || "",
        startingPrice: service.startingPrice ? String(service.startingPrice) : "",
        featured: service.featured || false,
        published: service.published || false,
        metaTitle: service.metaTitle || "",
        metaDescription: service.metaDescription || "",
        ogImage: service.ogImage || "",
        canonicalUrl: service.canonicalUrl || "",
        tags: service.tags || [],
        testimonialIds: service.testimonialIds || [],
      });
    }
  }, [service, reset]);

  const watchTitle = watch("title");
  const watchSlug = watch("slug");

  const onTitleChange = useCallback((title: string) => {
    setValue("title", title);
    if (!watchSlug || watchSlug === slugify(watchTitle)) {
      setValue("slug", slugify(title));
    }
  }, [setValue, watchSlug, watchTitle]);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch(`/api/dashboard/services/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update service");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "Service updated");
      setIsEditing(false);
    },
    onError: () => toast("error", "Failed to update service"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/dashboard/services/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete service");
    },
    onSuccess: () => {
      toast("success", "Service deleted");
      router.push("/dashboard/services");
    },
    onError: () => toast("error", "Failed to delete service"),
  });

  const handleSave = (data: ServiceForm) => {
    updateMutation.mutate({
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
    } as never);
  };

  // Package mutations
  const createPackageMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch(`/api/dashboard/services/packages`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "Package created");
      setShowAddPackage(false);
      setPkgForm({ name: "", description: "", price: "", features: [], deliveryTime: "", revisions: 0, supportDuration: "", isPopular: false, order: 0 });
    },
    onError: () => toast("error", "Failed to create package"),
  });

  const updatePackageMutation = useMutation({
    mutationFn: async ({ pkgId, data }: { pkgId: string; data: unknown }) => {
      const res = await fetch(`/api/dashboard/services/packages/${pkgId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update package");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "Package updated");
      setEditPackage(null);
    },
    onError: () => toast("error", "Failed to update package"),
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (pkgId: string) => {
      const res = await fetch(`/api/dashboard/services/packages/${pkgId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete package");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "Package deleted");
    },
    onError: () => toast("error", "Failed to delete package"),
  });

  // FAQ mutations
  const createFaqMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await fetch(`/api/dashboard/services/faqs`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create FAQ");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "FAQ created");
      setShowAddFaq(false);
      setFaqForm({ question: "", answer: "", order: 0 });
    },
    onError: () => toast("error", "Failed to create FAQ"),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      const res = await fetch(`/api/dashboard/services/faqs/${faqId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete FAQ");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-service", id] });
      toast("success", "FAQ deleted");
    },
    onError: () => toast("error", "Failed to delete FAQ"),
  });

  const handleAddPackage = () => {
    const result = createServicePackageSchema.safeParse({
      ...pkgForm,
      price: parseFloat(pkgForm.price),
      serviceId: id,
      description: pkgForm.description || null,
      deliveryTime: pkgForm.deliveryTime || null,
      supportDuration: pkgForm.supportDuration || null,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setPkgFormErrors(fieldErrors);
      return;
    }
    setPkgFormErrors({});
    createPackageMutation.mutate(result.data);
  };

  const handleUpdatePackage = () => {
    if (!editPackage) return;
    const result = createServicePackageSchema.partial().safeParse({
      ...pkgForm,
      price: pkgForm.price ? parseFloat(pkgForm.price) : undefined,
      description: pkgForm.description || null,
      deliveryTime: pkgForm.deliveryTime || null,
      supportDuration: pkgForm.supportDuration || null,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setPkgFormErrors(fieldErrors);
      return;
    }
    setPkgFormErrors({});
    updatePackageMutation.mutate({ pkgId: editPackage.id, data: result.data });
  };

  const handleAddFaq = () => {
    const result = createServiceFaqSchema.safeParse({
      ...faqForm,
      serviceId: id,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setFaqFormErrors(fieldErrors);
      return;
    }
    setFaqFormErrors({});
    createFaqMutation.mutate(result.data);
  };

  const openEditPackage = (pkg: ServicePackage) => {
    setEditPackage(pkg);
    setPkgForm({
      name: pkg.name, description: pkg.description ?? "", price: pkg.price.toString(),
      features: pkg.features, deliveryTime: pkg.deliveryTime ?? "", revisions: pkg.revisions,
      supportDuration: pkg.supportDuration ?? "", isPopular: pkg.isPopular, order: pkg.order,
    });
    setPkgFormErrors({});
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Layers className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load service</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{service.title}</h1>
              <Badge className={cn(service.published ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800")}>
                {service.published ? "Published" : "Draft"}
              </Badge>
              {service.featured && (
                <Badge className="bg-badge-warning-bg text-badge-warning-text hover:bg-amber-100 dark:hover:bg-amber-900/30">
                  <Star className="h-3 w-3 fill-amber-500" /> Featured
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{service.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button onClick={startEditing}>
              <Save className="h-4 w-4" /> Edit
            </Button>
          )}
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Views", value: service.viewCount.toLocaleString(), icon: Eye },
          { label: "Inquiries", value: service.inquiries?.length ?? 0, icon: Layers },
          { label: "Packages", value: service.packages?.length ?? 0, icon: Layers },
          { label: "FAQs", value: service.faqs?.length ?? 0, icon: Layers },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-zinc-400" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
              </div>
              <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Edit Form or View */}
      {isEditing ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Basic Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Title *</label>
                  <Input value={watch("title")} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Web Development" className={errors.title ? "border-red-400" : ""} />
                  {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Slug *</label>
                  <Input {...register("slug")} placeholder="e.g. web-development" className={cn("font-mono", errors.slug ? "border-red-400" : "")} />
                  {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Short Description</label>
                  <Textarea {...register("shortDescription")} rows={3} placeholder="Brief description for listing cards" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Full Description</label>
                  <Textarea {...register("fullDescription")} rows={8} placeholder="Detailed description of the service" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Category *</label>
                  <Select value={watch("categoryId")} onValueChange={(v) => setValue("categoryId", v ?? "")}>
                    <SelectTrigger className={cn("w-full", errors.categoryId ? "border-red-400" : "")}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Icon</label>
                  <Input {...register("icon")} placeholder="Icon identifier or URL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Featured Image</label>
                  <ImageUpload value={watch("featuredImage")} onChange={(url) => setValue("featuredImage", url)} endpoint="imageUploader" label="Featured" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Gallery Images</label>
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
                    render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add image URL..." />}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Features & Benefits</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Features</label>
                  <Controller control={control} name="features" render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add a feature..." />} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Benefits</label>
                  <Controller control={control} name="benefits" render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add a benefit..." />} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Technologies</label>
                  <Controller control={control} name="technologies" render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add a technology..." />} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Deliverables</label>
                  <Controller control={control} name="deliverables" render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add a deliverable..." />} />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Pricing & Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Starting Price ($)</label>
                  <Input type="number" min={0} {...register("startingPrice")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Estimated Timeline</label>
                  <Input {...register("estimatedTimeline")} placeholder="e.g. 2-4 weeks" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={watch("featured")} onChange={(e) => setValue("featured", e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
                  <span className="text-sm text-zinc-700 dark:text-muted-foreground">Featured</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={watch("published")} onChange={(e) => setValue("published", e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
                  <span className="text-sm text-zinc-700 dark:text-muted-foreground">Published</span>
                </label>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
              <CardContent>
                <Controller control={control} name="tags" render={({ field }) => <StringListInput items={field.value ?? []} onChange={field.onChange} placeholder="Add a tag..." />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Testimonials</CardTitle></CardHeader>
              <CardContent>
                <Controller control={control} name="testimonialIds" render={({ field }) => <TestimonialSelector selectedIds={field.value ?? []} onChange={field.onChange} />} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">SEO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Meta Title</label>
                  <Input {...register("metaTitle")} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Meta Description</label>
                  <Textarea {...register("metaDescription")} rows={3} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">OG Image</label>
                  <ImageUpload value={watch("ogImage")} onChange={(url) => setValue("ogImage", url)} endpoint="imageUploader" label="OG" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Canonical URL</label>
                  <Input {...register("canonicalUrl")} placeholder="https://example.com/services/my-service" />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button onClick={handleSubmit(handleSave)} disabled={updateMutation.isPending} className="flex-1">
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Service Details */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Service Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Category</p><p className="mt-1 text-sm text-zinc-900 dark:text-white">{service.category?.name ?? "—"}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Starting Price</p><p className="mt-1 text-sm text-zinc-900 dark:text-white">{service.startingPrice != null ? `$${service.startingPrice.toLocaleString()}` : "—"}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Estimated Timeline</p><p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{service.estimatedTimeline ?? "—"}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Views</p><p className="mt-1 text-sm text-zinc-900 dark:text-white">{service.viewCount.toLocaleString()}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Created</p><p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{new Date(service.createdAt).toLocaleString()}</p></div>
                <div><p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Updated</p><p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{new Date(service.updatedAt).toLocaleString()}</p></div>
              </div>
              {service.shortDescription && (
                <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Short Description</p>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">{service.shortDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Packages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm">Packages ({service.packages?.length ?? 0})</CardTitle>
                <Button variant="default" size="sm" onClick={() => { setShowAddPackage(true); setPkgForm({ name: "", description: "", price: "", features: [], deliveryTime: "", revisions: 0, supportDuration: "", isPopular: false, order: 0 }); setPkgFormErrors({}); }}>
                  <Plus className="h-3 w-3" /> Add Package
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!service.packages || service.packages.length === 0) ? (
                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No packages yet.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 -mx-(--card-spacing)">
                  {service.packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between px-(--card-spacing) py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900 dark:text-white">{pkg.name}</p>
                            {pkg.isPopular && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Popular</span>}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">${pkg.price.toLocaleString()} • {pkg.deliveryTime ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEditPackage(pkg)}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deletePackageMutation.mutate(pkg.id)} disabled={deletePackageMutation.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm">FAQs ({service.faqs?.length ?? 0})</CardTitle>
                <Button variant="default" size="sm" onClick={() => { setShowAddFaq(true); setFaqForm({ question: "", answer: "", order: 0 }); setFaqFormErrors({}); }}>
                  <Plus className="h-3 w-3" /> Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(!service.faqs || service.faqs.length === 0) ? (
                <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No FAQs yet.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 -mx-(--card-spacing)">
                  {service.faqs.map((faq) => (
                    <div key={faq.id} className="flex items-start justify-between px-(--card-spacing) py-4">
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{faq.question}</p>
                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">{faq.answer}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteFaqMutation.mutate(faq.id)} disabled={deleteFaqMutation.isPending} className="shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Package Modal */}
      <Dialog open={showAddPackage} onOpenChange={setShowAddPackage}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name *</label>
              <input type="text" value={pkgForm.name} onChange={(e) => setPkgForm((p) => ({ ...p, name: e.target.value }))} className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", pkgFormErrors.name ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")} />
              {pkgFormErrors.name && <p className="mt-1 text-xs text-red-500">{pkgFormErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
              <textarea value={pkgForm.description} onChange={(e) => setPkgForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Price *</label>
                <input type="number" min={0} value={pkgForm.price} onChange={(e) => setPkgForm((p) => ({ ...p, price: e.target.value }))} className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", pkgFormErrors.price ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")} />
                {pkgFormErrors.price && <p className="mt-1 text-xs text-red-500">{pkgFormErrors.price}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Delivery Time</label>
                <input type="text" value={pkgForm.deliveryTime} onChange={(e) => setPkgForm((p) => ({ ...p, deliveryTime: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" placeholder="e.g. 7 days" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Features</label>
              <StringListInput items={pkgForm.features} onChange={(items) => setPkgForm((p) => ({ ...p, features: items }))} placeholder="Add feature..." />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pkgForm.isPopular} onChange={(e) => setPkgForm((p) => ({ ...p, isPopular: e.target.checked }))} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
                <span className="text-sm text-zinc-700 dark:text-muted-foreground">Popular</span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddPackage(false)}>Cancel</Button>
            <Button onClick={handleAddPackage} disabled={createPackageMutation.isPending}>
              {createPackageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Package Modal */}
      <Dialog open={!!editPackage} onOpenChange={(o) => { if (!o) setEditPackage(null); }}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Name</label>
              <input type="text" value={pkgForm.name} onChange={(e) => setPkgForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Description</label>
              <textarea value={pkgForm.description} onChange={(e) => setPkgForm((p) => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Price</label>
                <input type="number" min={0} value={pkgForm.price} onChange={(e) => setPkgForm((p) => ({ ...p, price: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Delivery Time</label>
                <input type="text" value={pkgForm.deliveryTime} onChange={(e) => setPkgForm((p) => ({ ...p, deliveryTime: e.target.value }))} className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Features</label>
              <StringListInput items={pkgForm.features} onChange={(items) => setPkgForm((p) => ({ ...p, features: items }))} placeholder="Add feature..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pkgForm.isPopular} onChange={(e) => setPkgForm((p) => ({ ...p, isPopular: e.target.checked }))} className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700" />
              <span className="text-sm text-zinc-700 dark:text-muted-foreground">Popular</span>
            </label>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditPackage(null)}>Cancel</Button>
            <Button onClick={handleUpdatePackage} disabled={updatePackageMutation.isPending}>
              {updatePackageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add FAQ Modal */}
      <Dialog open={showAddFaq} onOpenChange={setShowAddFaq}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Question *</label>
              <input type="text" value={faqForm.question} onChange={(e) => setFaqForm((p) => ({ ...p, question: e.target.value }))} className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", faqFormErrors.question ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")} />
              {faqFormErrors.question && <p className="mt-1 text-xs text-red-500">{faqFormErrors.question}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-muted-foreground mb-1">Answer *</label>
              <textarea value={faqForm.answer} onChange={(e) => setFaqForm((p) => ({ ...p, answer: e.target.value }))} rows={4} className={cn("w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-800 dark:text-white", faqFormErrors.answer ? "border-red-400" : "border-zinc-300 dark:border-zinc-700")} />
              {faqFormErrors.answer && <p className="mt-1 text-xs text-red-500">{faqFormErrors.answer}</p>}
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddFaq(false)}>Cancel</Button>
            <Button onClick={handleAddFaq} disabled={createFaqMutation.isPending}>
              {createFaqMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete &ldquo;{service.title}&rdquo;? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
