"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Filter,
  Edit3,
  Trash2,
  Save,
  Globe,
  Tag,
  Link2,
  Activity,
  RefreshCw,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/ui/newsletter/Skeleton";
import { EmptyState } from "@/components/ui/newsletter/EmptyState";
import { useToast } from "@/components/ui/toast";

type ActivityLevel = "any" | "active" | "inactive" | "new";

const SOURCES = [
  { value: "footer", label: "Footer" },
  { value: "blog_sidebar", label: "Blog Sidebar" },
  { value: "contact_page", label: "Contact Page" },
  { value: "popup", label: "Popup" },
  { value: "exit_intent", label: "Exit Intent" },
  { value: "manual_import", label: "Manual Import" },
] as const;

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "new", label: "New" },
];

interface SegmentCriteria {
  countries: string[];
  tags: string[];
  sources: string[];
  activityLevel: ActivityLevel;
}

interface SegmentItem {
  id: string;
  name: string;
  description: string;
  isDynamic: boolean;
  criteria: SegmentCriteria;
}



function criteriaSummary(criteria: SegmentCriteria): string {
  const parts: string[] = [];
  if (criteria.countries.length > 0) {
    parts.push(`${criteria.countries.length} countr${criteria.countries.length === 1 ? "y" : "ies"}`);
  }
  if (criteria.tags.length > 0) {
    parts.push(`${criteria.tags.length} tag${criteria.tags.length === 1 ? "" : "s"}`);
  }
  if (criteria.sources.length > 0) {
    parts.push(`${criteria.sources.length} source${criteria.sources.length === 1 ? "" : "s"}`);
  }
  if (criteria.activityLevel !== "any") {
    parts.push(criteria.activityLevel);
  }
  return parts.length > 0 ? parts.join(", ") : "No filters";
}

export default function SegmentsPage() {
  const { toast } = useToast();
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [isLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<SegmentItem | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    isDynamic: true,
    countriesText: "",
    tagsText: "",
    sources: [] as string[],
    activityLevel: "any" as ActivityLevel,
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      isDynamic: true,
      countriesText: "",
      tagsText: "",
      sources: [],
      activityLevel: "any",
    });
    setEditingSegment(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (segment: SegmentItem) => {
    setForm({
      name: segment.name,
      description: segment.description,
      isDynamic: segment.isDynamic,
      countriesText: segment.criteria.countries.join(", "),
      tagsText: segment.criteria.tags.join(", "),
      sources: segment.criteria.sources,
      activityLevel: segment.criteria.activityLevel,
    });
    setEditingSegment(segment);
    setShowModal(true);
  };

  const toggleSource = (source: string) => {
    setForm((p) => ({
      ...p,
      sources: p.sources.includes(source)
        ? p.sources.filter((s) => s !== source)
        : [...p.sources, source],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast("error", "Segment name is required");
      return;
    }

    const criteria: SegmentCriteria = {
      countries: form.countriesText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tags: form.tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sources: form.sources,
      activityLevel: form.activityLevel,
    };

    if (editingSegment) {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === editingSegment.id
            ? {
                ...s,
                name: form.name.trim(),
                description: form.description.trim(),
                isDynamic: form.isDynamic,
                criteria,
              }
            : s
        )
      );
      toast("success", "Segment updated");
    } else {
      const newSegment: SegmentItem = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        description: form.description.trim(),
        isDynamic: form.isDynamic,
        criteria,
      };
      setSegments((prev) => [...prev, newSegment]);
      toast("success", "Segment created");
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;
    setSegments((prev) => prev.filter((s) => s.id !== id));
    toast("success", "Segment deleted");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Segments</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {segments.length} segment{segments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
        >
          <Plus className="h-4 w-4" />
          Create Segment
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={3} />
      ) : segments.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No segments created"
          description="Create segments to send targeted campaigns."
          action={{ label: "Create Your First Segment", onClick: openCreate }}
        />
      ) : (
        /* Segment List */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {segments.map((segment) => (
            <div
              key={segment.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {segment.name}
                    </h3>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                        segment.isDynamic
                          ? "bg-badge-info-bg text-badge-info-text"
                          : "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400"
                      )}
                    >
                      {segment.isDynamic ? (
                        <RefreshCw className="h-3 w-3" />
                      ) : (
                        <Hash className="h-3 w-3" />
                      )}
                      {segment.isDynamic ? "Dynamic" : "Static"}
                    </span>
                  </div>
                  {segment.description && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {segment.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Filter className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{criteriaSummary(segment.criteria)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button
                    onClick={() => openEdit(segment)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(segment.id)}
                    className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingSegment ? "Edit Segment" : "Create Segment"}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="e.g. European VIPs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder="Brief description of this segment..."
                />
              </div>

              {/* Dynamic Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <RefreshCw className={cn("h-4 w-4", form.isDynamic ? "text-blue-500" : "text-zinc-400")} />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">Dynamic Segment</p>
                    <p className="text-xs text-zinc-500">Automatically updates as subscribers match criteria</p>
                  </div>
                </div>
                <button
                  onClick={() => setForm((p) => ({ ...p, isDynamic: !p.isDynamic }))}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
                    form.isDynamic ? "bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                      form.isDynamic ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* Criteria Section */}
              <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">Criteria</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-zinc-400 mb-1">
                      <Globe className="inline h-3.5 w-3.5 mr-1" />
                      Countries
                    </label>
                    <input
                      type="text"
                      value={form.countriesText}
                      onChange={(e) => setForm((p) => ({ ...p, countriesText: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      placeholder="e.g. US, UK, Canada"
                    />
                    <p className="mt-0.5 text-xs text-zinc-400">Comma-separated country names</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-zinc-400 mb-1">
                      <Tag className="inline h-3.5 w-3.5 mr-1" />
                      Tags
                    </label>
                    <input
                      type="text"
                      value={form.tagsText}
                      onChange={(e) => setForm((p) => ({ ...p, tagsText: e.target.value }))}
                      className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      placeholder="e.g. vip, newsletter"
                    />
                    <p className="mt-0.5 text-xs text-zinc-400">Comma-separated tag names</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-zinc-400 mb-1">
                      <Link2 className="inline h-3.5 w-3.5 mr-1" />
                      Sources
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SOURCES.map((source) => (
                        <button
                          key={source.value}
                          onClick={() => toggleSource(source.value)}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                            form.sources.includes(source.value)
                              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          )}
                        >
                          {source.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground dark:text-zinc-400 mb-1">
                      <Activity className="inline h-3.5 w-3.5 mr-1" />
                      Activity Level
                    </label>
                    <div className="flex gap-2">
                      {ACTIVITY_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setForm((p) => ({ ...p, activityLevel: level.value }))}
                          className={cn(
                            "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                            form.activityLevel === level.value
                              ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "border-zinc-300 text-muted-foreground hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          )}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {editingSegment ? "Update Segment" : "Create Segment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
