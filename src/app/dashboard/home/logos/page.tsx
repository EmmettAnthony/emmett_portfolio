"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trustedLogoSchema, type TrustedLogoFormData } from "@/lib/validations/homepage";
import { Heart, Plus, Edit3, Trash2, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export default function HomeLogosPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<TrustedLogoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- zodResolver type compat
    resolver: zodResolver(trustedLogoSchema) as any,
    defaultValues: { name: "", logoUrl: "", website: null, enabled: true, order: 0 },
  });

  const { data, isLoading } = useQuery<{ logos: Record<string, unknown>[] }>({
    queryKey: ["dashboard-homepage-logos"],
    queryFn: async () => { const res = await fetch("/api/dashboard/home/logos"); if (!res.ok) throw new Error(); return res.json(); },
  });

  const logos = data?.logos ?? [];

  const saveMutation = useMutation({
    mutationFn: async (formData: TrustedLogoFormData) => {
      const url = editingId ? `/api/dashboard/home/logos/${editingId}` : "/api/dashboard/home/logos";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage-logos"] }); queryClient.invalidateQueries({ queryKey: ["dashboard-homepage"] }); toast("success", editingId ? "Updated" : "Added"); setShowForm(false); setEditingId(null); },
    onError: () => toast("error", "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const res = await fetch(`/api/dashboard/home/logos/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["dashboard-homepage-logos"] }); toast("success", "Deleted"); setDeleteId(null); },
    onError: () => toast("error", "Failed"),
  });

  const openAdd = () => { form.reset({ name: "", logoUrl: "", website: null, enabled: true, order: logos.length }); setEditingId(null); setShowForm(true); };
  const openEdit = (l: Record<string, unknown>) => { form.reset({ name: l.name as string, logoUrl: l.logoUrl as string, website: l.website as string | null, enabled: l.enabled as boolean, order: l.order as number }); setEditingId(l.id as string); setShowForm(true); };
  const onSubmit = (formData: TrustedLogoFormData) => saveMutation.mutate(formData);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-8 w-48" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/home"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div><h1 className="text-2xl font-bold">Trusted Logos</h1><p className="mt-1 text-sm text-zinc-500">{logos.length} total</p></div>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Add Logo</Button>
      </div>

      {logos.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No logos yet</h3>
          <Button className="mt-6" onClick={openAdd}><Plus className="h-4 w-4" />Add Logo</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo: Record<string, unknown>) => (
            <Card key={logo.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                  {logo.logoUrl ? <Image src={logo.logoUrl} alt={logo.name} width={40} height={40} className="max-h-10 max-w-10 object-contain" /> : <Heart className="h-6 w-6 text-zinc-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-white truncate">{logo.name}</p>
                  {logo.website && <p className="text-xs text-zinc-500 truncate">{logo.website}</p>}
                </div>
                <div className="flex items-center gap-1">
                  {logo.enabled ? <Eye className="h-3.5 w-3.5 text-green-500" /> : <EyeOff className="h-3.5 w-3.5 text-zinc-400" />}
                  <button onClick={() => openEdit(logo)} className="rounded p-1.5 text-zinc-400 hover:text-muted-foreground"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(logo.id)} className="rounded p-1.5 text-zinc-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">{editingId ? "Edit" : "Add"} Logo</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2"><Label>Company Name</Label><Input {...form.register("name")} placeholder="Acme Corp" /></div>
              <div className="space-y-2"><Label>Logo URL</Label><Input {...form.register("logoUrl")} placeholder="https://example.com/logo.png" /></div>
              <div className="space-y-2"><Label>Website (optional)</Label><Input {...form.register("website")} placeholder="https://example.com" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...form.register("enabled")} className="h-4 w-4 rounded border-zinc-300 text-blue-600" />
                <Label>Enabled</Label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700">Cancel</button>
                <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{editingId ? "Update" : "Create"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Delete Logo</h2>
            <p className="mt-2 text-sm text-zinc-500">Are you sure?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">{deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
