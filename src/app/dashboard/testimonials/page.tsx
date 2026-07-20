"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star, Plus, Pencil, Trash2, Search, X, Loader2,
  Check, Copy, Eye, Archive, RotateCcw,
  RefreshCw, Upload, Globe, FolderKanban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

const AUTOSAVE_KEY = "testimonial-form-draft";

interface Testimonial {
  id: string; name: string; jobTitle: string | null; company: string | null;
  companyWebsite: string | null; email: string | null; photo: string | null;
  companyLogo: string | null; title: string | null; content: string;
  rating: number; projectName: string | null; projectCategory: string | null;
  category: string | null; status: string; featured: boolean;
  displayOnHomepage: boolean; archived: boolean; order: number;
  metaTitle: string | null; metaDescription: string | null; ogImage: string | null;
  createdAt: string; updatedAt: string;
}

const statusStyles: Record<string, string> = {
  PENDING_REVIEW: "bg-badge-warning-bg text-badge-warning-text",
  APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};
const statusLabels: Record<string, string> = {
  PENDING_REVIEW: "Pending", APPROVED: "Approved", REJECTED: "Rejected",
};
const CATEGORIES = [
  "Web Development", "E-Commerce", "Software Development",
  "WordPress Development", "Consulting", "Website Maintenance",
];

interface TestimonialFormData {
  name: string; jobTitle: string; company: string; companyWebsite: string; email: string;
  photo: string; companyLogo: string; title: string; content: string; rating: number;
  projectName: string; projectCategory: string; category: string;
  status: string; featured: boolean; displayOnHomepage: boolean; archived: boolean; order: number;
  metaTitle: string; metaDescription: string; ogImage: string;
}

function EmptyForm(): TestimonialFormData {
  return {
    name: "", jobTitle: "", company: "", companyWebsite: "", email: "",
    photo: "", companyLogo: "", title: "", content: "", rating: 5,
    projectName: "", projectCategory: "", category: "",
    status: "PENDING_REVIEW", featured: false, displayOnHomepage: true, archived: false, order: 0,
    metaTitle: "", metaDescription: "", ogImage: "",
  };
}

function StarRating({ rating, size = "sm", interactive, onChange }: {
  rating: number; size?: "sm" | "lg" | "xl";
  interactive?: boolean; onChange?: (r: number) => void;
}) {
  const cls = size === "xl" ? "h-6 w-6" : size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < (hover || rating);
        return (
          <button key={i} type={interactive ? "button" : "button"}
            disabled={!interactive}
            onMouseEnter={() => interactive && setHover(i + 1)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(interactive && "cursor-pointer transition-transform hover:scale-110")}>
            <Star className={cn(cls, "transition-colors",
              filled ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground dark:text-muted-foreground")} />
          </button>
        );
      })}
    </div>
  );
}

export default function TestimonialsPage() {

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialFormData>(EmptyForm());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<Testimonial | null>(null);
  const [uploadingFor, setUploadingFor] = useState<"photo" | "logo" | null>(null);
  const queryClient = useQueryClient();
  const { startUpload } = useUploadThing("testimonialUploader");
  const { toast } = useToast();

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!form.name && !form.content) return;
    const timer = setInterval(() => {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form));
    }, 15000);
    return () => clearInterval(timer);
  }, [form]);

  // Restore draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem(AUTOSAVE_KEY);
      if (draft && !showModal) {
        const data = JSON.parse(draft);
        if (data.name || data.content) {
          /* eslint-disable-next-line react-hooks/set-state-in-effect */
          setForm(data);
        }
      }
    } catch {}
  }, [showModal]);

  const { data, isLoading } = useQuery({
    queryKey: ["testimonials", search, statusFilter, sortBy, sortOrder, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/testimonials?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (d: TestimonialFormData) => {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonials"] }); closeModal(); toast("success", "Testimonial created"); },
    onError: (err: Error) => { toast("error", err.message); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TestimonialFormData }) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonials"] }); closeModal(); toast("success", "Testimonial updated"); },
    onError: (err: Error) => { toast("error", err.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonials"] }); setDeletingId(null); toast("success", "Testimonial deleted"); },
    onError: () => { toast("error", "Failed to delete"); },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: string }) => {
      const res = await fetch("/api/admin/testimonials", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["testimonials"] }); setSelected(new Set()); toast("success", "Bulk action completed"); },
    onError: () => { toast("error", "Bulk action failed"); },
  });

  const testimonials: Testimonial[] = data?.testimonials || [];
  const pagination = data?.pagination || { page: 1, total: 0, pages: 1 };

  function closeModal() { setShowModal(false); setEditing(null); setForm(EmptyForm()); localStorage.removeItem(AUTOSAVE_KEY); }
  function openAdd() { setEditing(null); setForm(EmptyForm()); setShowModal(true); }

  function openEdit(t: Testimonial) {
    setEditing(t);
    setForm({
      name: t.name, jobTitle: t.jobTitle || "", company: t.company || "",
      companyWebsite: t.companyWebsite || "", email: t.email || "",
      photo: t.photo || "", companyLogo: t.companyLogo || "",
      title: t.title || "", content: t.content, rating: t.rating,
      projectName: t.projectName || "", projectCategory: t.projectCategory || "",
      category: t.category || "", status: t.status,
      featured: t.featured, displayOnHomepage: t.displayOnHomepage, archived: t.archived, order: t.order,
      metaTitle: t.metaTitle || "", metaDescription: t.metaDescription || "", ogImage: t.ogImage || "",
    });
    setShowModal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function toggleSelectAll() {
    if (selected.size === testimonials.length) setSelected(new Set());
    else setSelected(new Set(testimonials.map((t) => t.id)));
  }

  async function handleImageUpload(field: "photo" | "logo") {
    setUploadingFor(field);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { setUploadingFor(null); return; }
      try {
        const res = await startUpload([file]);
        if (res?.[0]?.url) {
          setForm((prev) => ({ ...prev, [field === "photo" ? "photo" : "companyLogo"]: res[0].url }));
        }
      } catch (err) { console.error("Upload failed:", err); }
      finally { setUploadingFor(null); }
    };
    input.click();
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Testimonials</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {pagination.total} total &middot; {testimonials.filter((t: Testimonial) => t.status === "PENDING_REVIEW").length} pending
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs text-zinc-500">{selected.size} selected</span>
              <button onClick={() => bulkMutation.mutate({ ids: Array.from(selected), action: "approve" })}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <Check className="mr-1 inline h-3 w-3" />Approve
              </button>
              <button onClick={() => bulkMutation.mutate({ ids: Array.from(selected), action: "reject" })}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <X className="mr-1 inline h-3 w-3" />Reject
              </button>
              <button onClick={() => bulkMutation.mutate({ ids: Array.from(selected), action: "feature" })}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <Star className="mr-1 inline h-3 w-3" />Feature
              </button>
              <button onClick={() => bulkMutation.mutate({ ids: Array.from(selected), action: "duplicate" })}
                className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <Copy className="mr-1 inline h-3 w-3" />Duplicate
              </button>
              <button onClick={() => bulkMutation.mutate({ ids: Array.from(selected), action: "delete" })}
                className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">
                <Trash2 className="mr-1 inline h-3 w-3" />Delete
              </button>
            </div>
          )}
          <button onClick={openAdd}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" /> Add Testimonial
          </button>
          <Link href="/dashboard/testimonials/categories"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">
            <FolderKanban className="h-4 w-4" /> Categories
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, company, content..."
            className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
          <option value="">All Status</option>
          <option value="PENDING_REVIEW">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={`${sortBy}:${sortOrder}`} onChange={(e) => { const [b, o] = e.target.value.split(":"); setSortBy(b); setSortOrder(o); setPage(1); }}
          className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-900 dark:text-white">
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
          <option value="name:asc">Name A-Z</option>
          <option value="name:desc">Name Z-A</option>
          <option value="rating:desc">Highest Rating</option>
          <option value="rating:asc">Lowest Rating</option>
          <option value="order:asc">Order Asc</option>
        </select>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["testimonials"] })}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" checked={selected.size === testimonials.length && testimonials.length > 0}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
              </th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 hidden md:table-cell">Rating</th>
              <th className="px-4 py-3 hidden lg:table-cell">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden sm:table-cell">HP</th>
              <th className="px-4 py-3 hidden md:table-cell">Date</th>
              <th className="w-24 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              </td></tr>
            ) : testimonials.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-zinc-500">No testimonials found.</td></tr>
            ) : testimonials.map((t) => (
              <tr key={t.id} className={cn(
                "transition-colors hover:bg-zinc-50 dark:hover:bg-surface",
                selected.has(t.id) && "bg-blue-50 dark:bg-blue-900/10"
              )}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      {t.photo ? (
                        <Image src={t.photo} alt="" fill className="object-cover" sizes="36px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-zinc-500">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-white">{t.name}</p>
                      {(t.jobTitle || t.company) && (
                        <p className="truncate text-xs text-zinc-500">{[t.jobTitle, t.company].filter(Boolean).join(" at ")}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell"><StarRating rating={t.rating} /></td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="text-xs text-muted-foreground dark:text-zinc-400">{t.category || "-"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium", statusStyles[t.status] || "")}>
                    {t.status === "APPROVED" && <Check className="h-3 w-3" />}
                    {t.status === "REJECTED" && <X className="h-3 w-3" />}
                    {t.status === "PENDING_REVIEW" && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                    {statusLabels[t.status] || t.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {t.displayOnHomepage ? (
                    <Globe className="h-4 w-4 text-blue-500" />
                  ) : <span className="text-muted-foreground dark:text-muted-foreground">&mdash;</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="text-xs text-zinc-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setPreview(t)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Preview">
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => openEdit(t)}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => bulkMutation.mutate({ ids: [t.id], action: "duplicate" })}
                      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {t.archived ? (
                      <button onClick={() => bulkMutation.mutate({ ids: [t.id], action: "restore" })}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Restore">
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => bulkMutation.mutate({ ids: [t.id], action: "archive" })}
                        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Archive">
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => setDeletingId(t.id)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700">Previous</button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={cn("min-w-[2rem] rounded-lg px-2 py-1.5 text-sm",
                p === page ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800")}>{p}</button>
          ))}
          <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700">Next</button>
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Preview</h3>
              <button onClick={() => setPreview(null)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {preview.photo ? <Image src={preview.photo} alt="" fill className="object-cover" sizes="48px" />
                    : <div className="flex h-full w-full items-center justify-center text-lg font-medium text-zinc-500">{preview.name.charAt(0)}</div>}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{preview.name}</p>
                  {(preview.jobTitle || preview.company) && <p className="text-sm text-zinc-500">{[preview.jobTitle, preview.company].filter(Boolean).join(" at ")}</p>}
                </div>
              </div>
              <StarRating rating={preview.rating} size="lg" />
              {preview.title && <p className="text-lg font-semibold text-zinc-900 dark:text-white">{preview.title}</p>}
              <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">{preview.content}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editing ? "Edit Testimonial" : "New Testimonial"}
              </h3>
              <button onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Client Information */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Client Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Full Name *</label>
                    <input required type="text" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Email</label>
                    <input type="email" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Job Title</label>
                    <input type="text" value={form.jobTitle}
                      onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company</label>
                    <input type="text" value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company Website</label>
                    <input type="url" value={form.companyWebsite}
                      onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Photo</label>
                    <div className="flex items-center gap-3">
                      {form.photo ? (
                        <div className="relative">
                          <Image src={form.photo} alt="Preview" width={56} height={56} className="rounded-full object-cover" />
                          <button type="button" onClick={() => setForm({ ...form, photo: "" })}
                            className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-0.5 text-white dark:bg-white dark:text-zinc-900">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-semibold text-zinc-400 dark:bg-zinc-800">
                          {form.name ? form.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      )}
                      <button type="button" onClick={() => handleImageUpload("photo")} disabled={uploadingFor === "photo"}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm text-muted-foreground hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                        {uploadingFor === "photo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingFor === "photo" ? "Uploading..." : "Upload Photo"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Company Logo</label>
                    <div className="flex items-center gap-3">
                      {form.companyLogo ? (
                        <div className="relative">
                          <Image src={form.companyLogo} alt="Logo" width={56} height={56} className="rounded object-contain border border-zinc-200 dark:border-zinc-700" />
                          <button type="button" onClick={() => setForm({ ...form, companyLogo: "" })}
                            className="absolute -right-1 -top-1 rounded-full bg-zinc-900 p-0.5 text-white dark:bg-white dark:text-zinc-900">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                          Logo
                        </div>
                      )}
                      <button type="button" onClick={() => handleImageUpload("logo")} disabled={uploadingFor === "logo"}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm text-muted-foreground hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                        {uploadingFor === "logo" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingFor === "logo" ? "Uploading..." : "Upload Logo"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial Content */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Testimonial</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Title</label>
                    <input type="text" value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Outstanding Web Development Service"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Content *</label>
                      <span className={cn("text-xs", form.content.length > 500 ? "text-amber-600" : "text-zinc-400")}>
                        {form.content.length} / 1000
                      </span>
                    </div>
                    <textarea required rows={4} value={form.content} maxLength={1000}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Rating</label>
                    <StarRating rating={form.rating} size="xl" interactive onChange={(r) => setForm({ ...form, rating: r })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Project Name</label>
                      <input type="text" value={form.projectName}
                        onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Category</label>
                      <select value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value === "__custom__" ? "" : e.target.value })}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        <option value="__custom__">Custom...</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status & Settings */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Status & Settings</h4>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Status</label>
                    <select value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
                      <option value="PENDING_REVIEW">Pending Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Order</label>
                    <input type="number" value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="flex flex-col gap-2 pb-2">
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-muted-foreground">
                      <input type="checkbox" checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                      <Star className="h-3.5 w-3.5 text-amber-400" /> Featured
                    </label>
                    <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-muted-foreground">
                      <input type="checkbox" checked={form.displayOnHomepage}
                        onChange={(e) => setForm({ ...form, displayOnHomepage: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-ring dark:border-zinc-700" />
                      <Globe className="h-3.5 w-3.5 text-blue-500" /> Show on homepage
                    </label>
                  </div>
                </div>
              </div>

              {/* SEO */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">SEO</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Meta Title</label>
                    <input type="text" value={form.metaTitle}
                      onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Meta Description</label>
                    <input type="text" value={form.metaDescription}
                      onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
                {form.name || form.content ? (
                  <span className="text-xs text-zinc-400">Draft auto-saved</span>
                ) : <span />}
                <div className="flex gap-3">
                  <button type="button" onClick={closeModal}
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
                  <button type="submit" disabled={isPending}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
                    {isPending ? "Saving..." : editing ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-white">Delete Testimonial</h3>
            <p className="mb-6 text-sm text-muted-foreground dark:text-zinc-400">Are you sure you want to delete this testimonial?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingId(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deletingId)} disabled={deleteMutation.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
