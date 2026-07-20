"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  useEffect,
  useState
} from "react";
import { Loader2, ArrowLeft, Save, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  portfolioProjectSchema
} from "@/lib/validations/portfolio";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImageUpload from "@/components/ui/ImageUpload";
import { UploadButton } from "@/lib/uploadthing-client";
import { TestimonialSelector } from "@/components/services/TestimonialSelector";
import type { PortfolioProjectForm, CaseStudyForm } from "@/lib/validations/portfolio";

type Category = { id: string; name: string; slug: string };
type Technology = { id: string; name: string; slug: string; icon?: string; color?: string };

const defaultValues: PortfolioProjectForm = {
  title: "", slug: "", shortDescription: "", fullDescription: "",
  projectSummary: "", clientName: "", clientIndustry: "",
  categoryId: "", featuredImage: "", thumbnailImage: "",
  projectLogo: "", galleryImages: [], videoDemo: "",
  startDate: "", completionDate: "", projectDuration: "", teamSize: 0,
  status: "DRAFT", featured: false, published: false, order: 0,
  liveUrl: "", githubUrl: "", demoUrl: "", caseStudyUrl: "",
  technologyIds: [], tags: [], awards: [], testimonialIds: [],
  metaTitle: "", metaDescription: "", ogImage: "", canonicalUrl: "",
  metrics: [],
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
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder={placeholder} className="flex-1 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
        <button type="button" onClick={add} className="rounded-xl bg-blue-600 p-2 text-white hover:bg-blue-700"><Plus className="h-4 w-4" /></button>
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

export default function CreatePortfolioPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<PortfolioProjectForm>({
    resolver: zodResolver(portfolioProjectSchema),
    defaultValues,
  });

  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ["portfolio-categories"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: technologiesData } = useQuery<{ technologies: Technology[] }>({
    queryKey: ["portfolio-technologies"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/portfolio/technologies");
      if (!res.ok) throw new Error("Failed to fetch technologies");
      return res.json();
    },
  });

  const categories = categoriesData?.categories ?? [];
  const technologies = technologiesData?.technologies ?? [];      // eslint-disable-next-line react-hooks/incompatible-library
      const watchTitle = watch("title");
      useEffect(() => {
    if (watchTitle) {
      const slug = watchTitle
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [watchTitle, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: PortfolioProjectForm) => {
      const res = await fetch("/api/dashboard/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create project");
      }
      return res.json();
    },
    onSuccess: () => {
      toast("success", "Project created");
      router.push("/dashboard/portfolio");
    },
    onError: (err: Error) => {
      toast("error", err.message || "Failed to create project");
    },
  });

  const onSubmit = (data: PortfolioProjectForm) => {
    createMutation.mutate(data);
  };

  const addGalleryImage = (url: string) => {
    const current = getValues("galleryImages") || [];
    setValue("galleryImages", [...current, url], { shouldValidate: true });
  };



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Create Portfolio Project</h1>
        </div>
        <Button type="submit" form="portfolio-form" disabled={isSubmitting || createMutation.isPending}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Project
        </Button>
      </div>

      <form id="portfolio-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" {...register("title")} placeholder="Project title" />
                  {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" {...register("slug")} placeholder="auto-generated-from-title" className="font-mono" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Textarea id="shortDescription" {...register("shortDescription")} rows={3} placeholder="Brief overview" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullDescription">Full Description</Label>
                  <Textarea id="fullDescription" {...register("fullDescription")} rows={8} placeholder="Detailed description" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectSummary">Project Summary</Label>
                  <Textarea id="projectSummary" {...register("projectSummary")} rows={3} placeholder="Executive summary" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name</Label>
                    <Input id="clientName" {...register("clientName")} placeholder="Client name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientIndustry">Client Industry</Label>
                    <Input id="clientIndustry" {...register("clientIndustry")} placeholder="e.g. Healthcare" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Controller
                      control={control}
                      name="categoryId"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Controller
                      control={control}
                      name="featured"
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-ring dark:border-zinc-600"
                        />
                      )}
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Controller
                      control={control}
                      name="published"
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-ring dark:border-zinc-600"
                        />
                      )}
                    />
                    Published
                  </label>
                  <div className="w-24">
                    <Label htmlFor="order">Order</Label>
                    <Input id="order" type="number" {...register("order", { valueAsNumber: true })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Featured Image</Label>
                    <Controller
                      control={control}
                      name="featuredImage"
                      render={({ field }) => (
                        <ImageUpload value={field.value} onChange={field.onChange} label="Featured Image" />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Thumbnail Image</Label>
                    <Controller
                      control={control}
                      name="thumbnailImage"
                      render={({ field }) => (
                        <ImageUpload value={field.value} onChange={field.onChange} label="Thumbnail Image" />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project Logo</Label>
                    <Controller
                      control={control}
                      name="projectLogo"
                      render={({ field }) => (
                        <ImageUpload value={field.value} onChange={field.onChange} label="Project Logo" />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images</Label>
                  <div className="flex gap-2">
                    <UploadButton
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
                      endpoint={"imageUploader" as any}
                      onClientUploadComplete={(res) => {
                        if (res?.[0]?.url) addGalleryImage(res[0].url);
                      }}
                      onUploadError={(err) => console.error("Upload failed:", err)}
                      appearance={{
                        button: "inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200",
                      }}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="galleryImages"
                    render={({ field }) => (
                      <StringListInput
                        items={field.value || []}
                        onChange={field.onChange}
                        placeholder="Add image URL..."
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoDemo">Video Demo URL</Label>
                  <Input id="videoDemo" {...register("videoDemo")} placeholder="https://youtube.com/..." />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" {...register("startDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completionDate">Completion Date</Label>
                    <Input id="completionDate" type="date" {...register("completionDate")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDuration">Project Duration</Label>
                    <Input id="projectDuration" {...register("projectDuration")} placeholder="e.g. 3 months" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Team Size</Label>
                    <Input id="teamSize" type="number" {...register("teamSize", { valueAsNumber: true })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technologies</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="technologyIds"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {technologies.map((tech) => {
                        const selected = (field.value || []).includes(tech.id);
                        return (
                          <label
                            key={tech.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                              selected
                                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-400"
                                : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...(field.value || []), tech.id]);
                                } else {
                                  field.onChange((field.value || []).filter((id) => id !== tech.id));
                                }
                              }}
                              className="sr-only"
                            />
                            {tech.name}
                          </label>
                        );
                      })}
                      {technologies.length === 0 && (
                        <p className="col-span-full text-sm text-zinc-500">No technologies available.</p>
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="liveUrl">Live Website URL</Label>
                  <Input id="liveUrl" {...register("liveUrl")} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub Repository</Label>
                  <Input id="githubUrl" {...register("githubUrl")} placeholder="https://github.com/..." />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demoUrl">Demo URL</Label>
                    <Input id="demoUrl" {...register("demoUrl")} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="caseStudyUrl">Case Study URL</Label>
                    <Input id="caseStudyUrl" {...register("caseStudyUrl")} placeholder="https://..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Controller
                  control={control}
                  name="metrics"
                  render={({ field }) => (
                    <div className="space-y-4">
                      {(field.value || []).map((metric, index) => (
                        <div key={index} className="relative rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
                          <button
                            type="button"
                            onClick={() => {
                              const current = [...(field.value || [])];
                              current.splice(index, 1);
                              field.onChange(current);
                            }}
                            className="absolute right-2 top-2 text-zinc-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Label</Label>
                              <Input
                                value={metric.label}
                                onChange={(e) => {
                                  const current = [...(field.value || [])];
                                  current[index] = { ...current[index], label: e.target.value };
                                  field.onChange(current);
                                }}
                                placeholder="e.g. Users"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Value</Label>
                              <Input
                                value={metric.value}
                                onChange={(e) => {
                                  const current = [...(field.value || [])];
                                  current[index] = { ...current[index], value: e.target.value };
                                  field.onChange(current);
                                }}
                                placeholder="e.g. 10K+"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Prefix</Label>
                              <Input
                                value={metric.prefix}
                                onChange={(e) => {
                                  const current = [...(field.value || [])];
                                  current[index] = { ...current[index], prefix: e.target.value };
                                  field.onChange(current);
                                }}
                                placeholder="e.g. $"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Suffix</Label>
                              <Input
                                value={metric.suffix}
                                onChange={(e) => {
                                  const current = [...(field.value || [])];
                                  current[index] = { ...current[index], suffix: e.target.value };
                                  field.onChange(current);
                                }}
                                placeholder="e.g. %"
                              />
                            </div>
                          </div>
                          <div className="mt-2 w-24">
                            <Label className="text-xs">Order</Label>
                            <Input
                              type="number"
                              value={metric.order}
                              onChange={(e) => {
                                const current = [...(field.value || [])];
                                current[index] = { ...current[index], order: Number(e.target.value) };
                                field.onChange(current);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => {
                        field.onChange([...(field.value || []), { label: "", value: "", prefix: "", suffix: "", order: (field.value || []).length }]);
                      }}>
                        <Plus className="h-4 w-4" />
                        Add Metric
                      </Button>
                    </div>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="tags"
                  render={({ field }) => (
                    <StringListInput items={field.value || []} onChange={field.onChange} placeholder="Add tag..." />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Awards</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="awards"
                  render={({ field }) => (
                    <StringListInput items={field.value || []} onChange={field.onChange} placeholder="Add award..." />
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Testimonials</CardTitle>
              </CardHeader>
              <CardContent>
                <Controller
                  control={control}
                  name="testimonialIds"
                  render={({ field }) => (
                    <TestimonialSelector selectedIds={field.value || []} onChange={field.onChange} />
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input id="metaTitle" {...register("metaTitle")} placeholder="SEO title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea id="metaDescription" {...register("metaDescription")} rows={3} placeholder="SEO description" />
                </div>
                <div className="space-y-2">
                  <Label>OG Image</Label>
                  <Controller
                    control={control}
                    name="ogImage"
                    render={({ field }) => (
                      <ImageUpload value={field.value} onChange={field.onChange} label="OG Image" />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input id="canonicalUrl" {...register("canonicalUrl")} placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
