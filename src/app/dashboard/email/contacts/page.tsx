"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Inbox,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Loader2,
  Download,
  Upload,
  CheckSquare,
  Square,
  Tags,
  Plus,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import CsvImportDialog from "@/components/email/CsvImportDialog";
import { exportContactsCsvAction, importContactsCsvAction } from "@/actions/email/contacts";

interface ContactMember {
  id: string;
  listId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  country: string | null;
  status: string;
  source: string | null;
  brevoSyncStatus: string;
  createdAt: string;
}

interface ContactsResponse {
  members: ContactMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const STATUS_OPTIONS = ["ACTIVE", "UNSUBSCRIBED", "BOUNCED", "PENDING"] as const;

export default function ContactsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [listFilter, setListFilter] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkStatus, setShowBulkStatus] = useState(false);

  // Create contact
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCountry, setNewCountry] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: {
      listId: string; email: string; firstName?: string; lastName?: string;
      company?: string; phone?: string; country?: string;
    }) => {
      const res = await fetch("/api/email/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "create" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create contact");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-contacts"] });
      toast("success", "Contact created");
      setShowCreate(false);
      setNewEmail(""); setNewFirstName(""); setNewLastName("");
      setNewCompany(""); setNewPhone(""); setNewCountry("");
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  // CSV import dialog
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading } = useQuery<ContactsResponse>({
    queryKey: ["email-contacts", search, statusFilter, page, listFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (listFilter) params.set("listId", listFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/email/contacts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });

  const { data: lists } = useQuery({
    queryKey: ["contact-lists"],
    queryFn: async () => {
      const res = await fetch("/api/email/contact-lists");
      if (!res.ok) throw new Error("Failed to fetch lists");
      return res.json();
    },
  });

  // ─── Bulk Actions ────────────────────────────────────────────────────

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/email/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-delete", ids }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-contacts"] });
      toast("success", `Deleted ${result.deleted} contact(s)`);
      setSelectedIds(new Set());
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const res = await fetch("/api/email/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk-status", ids, status }),
      });
      if (!res.ok) throw new Error("Bulk status update failed");
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["email-contacts"] });
      toast("success", `Updated ${result.updated} contact(s)`);
      setSelectedIds(new Set());
      setShowBulkStatus(false);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const handleSelectAll = useCallback(() => {
    if (!data?.members) return;
    if (selectedIds.size === data.members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.members.map((m) => m.id)));
    }
  }, [data, selectedIds]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExportCsv = useCallback(async () => {
    try {
      const result = await exportContactsCsvAction(listFilter || undefined);
      // Create a downloadable blob from the CSV string returned by the server action
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || `contacts-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("success", "Contacts exported successfully");
    } catch (err) {
      toast("error", `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }, [listFilter, toast]);

  const handleCsvImport = useCallback(async (importData: { csvData: string; listId: string; updateExisting: boolean }) => {
    try {
      const result = await importContactsCsvAction({
        csvData: importData.csvData,
        listId: importData.listId,
        updateExisting: importData.updateExisting,
      });
      queryClient.invalidateQueries({ queryKey: ["email-contacts"] });
      const imported = typeof result.count === "number" ? result.count : 0;
      const parts = [`Imported ${imported}`];
      toast("success", parts.join(", "));
      return result;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Import failed");
    }
  }, [queryClient, toast]);

  // Delete single contact
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/email/contacts?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contact");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-contacts"] });
      toast("success", "Contact deleted");
      setDeleteId(null);
    },
    onError: (err) => toast("error", `Failed: ${err.message}`),
  });

  const allSelected = data?.members && data.members.length > 0 && selectedIds.size === data.members.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Contacts</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage all contacts across your lists
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select
          value={listFilter}
          onChange={(e) => { setListFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">All Lists</option>
          {lists?.map((list: { id: string; name: string }) => (
            <option key={list.id} value={list.id}>{list.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreate(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            New Contact
          </Button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
        </div>

        <span className="text-xs text-zinc-400">{data?.total ?? 0} total contacts</span>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 px-4 py-2.5 dark:border-brand-800 dark:bg-brand-900/20">
          <span className="text-sm font-medium text-brand-700 dark:text-brand-300">
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-brand-200 dark:bg-brand-700" />
          <button
            onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
            disabled={bulkDeleteMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            {bulkDeleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </button>
          <div className="relative">
            <button
              onClick={() => setShowBulkStatus(!showBulkStatus)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              <Tags className="h-3.5 w-3.5" />
              Change Status
            </button>
            {showBulkStatus && (
              <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => bulkStatusMutation.mutate({ ids: Array.from(selectedIds), status: s })}
                    disabled={bulkStatusMutation.isPending}
                    className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="w-12 px-4 py-3 text-left">
                  <button onClick={handleSelectAll} className="p-0.5">
                    {allSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Square className="h-4 w-4 text-zinc-400" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Company</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Sync</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Added</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.members && data.members.length > 0 ? (
                data.members.map((contact) => (
                  <tr
                    key={contact.id}
                    className={cn(
                      "transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                      selectedIds.has(contact.id) && "bg-brand-50/50 dark:bg-brand-900/10"
                    )}
                  >
                    <td className="px-4 py-4">
                      <button onClick={() => handleSelectOne(contact.id)} className="p-0.5">
                        {selectedIds.has(contact.id) ? (
                          <CheckSquare className="h-4 w-4 text-brand-600" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {contact.firstName || contact.lastName
                            ? `${contact.firstName || ""} ${contact.lastName || ""}`
                            : "—"}
                        </p>
                        <p className="text-xs text-zinc-500">{contact.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-500">
                        {contact.company || "—"}
                        {contact.country && <span className="ml-2 text-xs">({contact.country})</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        contact.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        contact.status === "UNSUBSCRIBED" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" :
                        contact.status === "BOUNCED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        contact.brevoSyncStatus === "SYNCED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        contact.brevoSyncStatus === "FAILED" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      )}>
                        {contact.brevoSyncStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteId(contact.id)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-100 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center text-zinc-400">
                      <Inbox className="mb-2 h-8 w-8" />
                      <p className="text-sm text-zinc-500">No contacts found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">Page {data.page} of {data.totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 disabled:opacity-50">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Single Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Contact</DialogTitle></DialogHeader>
          <p className="text-sm text-zinc-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Contact Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">List</label>
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                <option value="">Select a list</option>
                {lists?.map((list: { id: string; name: string }) => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
              {!listFilter && <p className="mt-1 text-xs text-amber-500">Select a list first</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contact@example.com"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">First Name</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Last Name</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Company</label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Country</label>
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
              <input
                type="text"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate({
                  listId: listFilter,
                  email: newEmail,
                  firstName: newFirstName || undefined,
                  lastName: newLastName || undefined,
                  company: newCompany || undefined,
                  phone: newPhone || undefined,
                  country: newCountry || undefined,
                })}
                disabled={!listFilter || !newEmail.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        listId={listFilter}
        lists={lists || []}
        onImport={handleCsvImport}
      />
    </div>
  );
}
