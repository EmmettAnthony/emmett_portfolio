"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  contactsCount: number;
  dealsValue: number;
  createdAt: string;
}

interface CompanyFormData {
  name: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
}

const emptyForm: CompanyFormData = {
  name: "",
  industry: "",
  website: "",
  phone: "",
  address: "",
};

export default function CompaniesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CompanyFormData>(emptyForm);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = 15;

  const { data, isLoading } = useQuery({
    queryKey: ["crm-companies", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), search });
      const res = await fetch(`/api/dashboard/crm/companies?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const res = await fetch("/api/dashboard/crm/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-companies"] });
      toast("success", "Company created");
      setShowModal(false);
      setForm(emptyForm);
    },
    onError: () => toast("error", "Failed to create company"),
  });

  const companies: Company[] = data?.companies ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Companies</h1>
          <p className="mt-1 text-sm text-zinc-500">{data?.total ?? 0} total companies</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search companies..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-500">No companies found.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Industry</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Website</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Contacts</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Deals Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground dark:text-zinc-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                      <a href={`/dashboard/crm/companies/${company.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{company.name}</a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{company.industry || "\u2014"}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">
                      {company.website ? (
                        <a href={company.website} target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">{company.website}</a>
                      ) : "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{company.contactsCount}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">${company.dealsValue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground dark:text-zinc-400">{new Date(company.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Add Company</h3>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Name *</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Industry</label>
                  <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Phone</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Website</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700 dark:text-muted-foreground">Address</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>Create Company</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
