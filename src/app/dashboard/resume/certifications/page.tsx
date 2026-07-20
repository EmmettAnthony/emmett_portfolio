"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  certificationSchema, type CertificationFormData,
} from "@/lib/validations/resume";
import { cn } from "@/lib/utils";
import {
  Award, Plus, Edit3, Trash2, Loader2, ArrowUp, ArrowDown,
  ExternalLink, Calendar, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  certificateFile: string | null;
  order: number;
}

export default function CertificationsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CertificationFormData>({
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod resolver type mismatch
    resolver: zodResolver(certificationSchema) as any,
    defaultValues: {
      name: "",
      organization: "",
      issueDate: "",
      expiryDate: null,
      credentialId: null,
      credentialUrl: null,
      certificateFile: null,
      order: 0,
    },
  });

  const { data, isLoading, error } = useQuery<{ certifications: Certification[] }>({
    queryKey: ["dashboard-resume-certifications"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/resume/certifications");
      if (!res.ok) throw new Error("Failed to fetch certifications");
      return res.json();
    },
  });

  const certifications = data?.certifications ?? [];

  const openAdd = () => {
    form.reset({ name: "", organization: "", issueDate: "", expiryDate: null, credentialId: null, credentialUrl: null, certificateFile: null, order: certifications.length });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (cert: Certification) => {
    form.reset({
      name: cert.name,
      organization: cert.organization,
      issueDate: cert.issueDate ? cert.issueDate.split("T")[0] : "",
      expiryDate: cert.expiryDate ? cert.expiryDate.split("T")[0] : null,
      credentialId: cert.credentialId,
      credentialUrl: cert.credentialUrl,
      certificateFile: cert.certificateFile,
      order: cert.order,
    });
    setEditingId(cert.id);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: CertificationFormData) => {
      const url = editingId ? `/api/dashboard/resume/certifications/${editingId}` : "/api/dashboard/resume/certifications";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to save certification");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-certifications"] });
      toast("success", editingId ? "Certification updated" : "Certification added");
      setShowForm(false);
      setEditingId(null);
    },
    onError: () => toast("error", "Failed to save certification"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/dashboard/resume/certifications/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete certification");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-certifications"] });
      toast("success", "Certification deleted");
      setDeleteId(null);
    },
    onError: () => toast("error", "Failed to delete certification"),
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= certifications.length) return;
    const items = [...certifications];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    const reordered = items.map((item, i) => ({ id: item.id, order: i }));
    Promise.all(
      reordered.map((item) => {
        const cert = certifications.find((c) => c.id === item.id);
        return fetch(`/api/dashboard/resume/certifications/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cert ? { ...cert, order: item.order } : {}),
        });
      })
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-resume-certifications"] });
    }).catch(() => toast("error", "Failed to reorder"));
  };

  const onSubmit = (formData: CertificationFormData) => {
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
        <Award className="mb-3 h-10 w-10 text-red-400" />
        <p className="text-lg font-medium text-red-600 dark:text-red-400">Failed to load certifications</p>
        <p className="mt-1 text-sm">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Certifications</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{certifications.length} total certifications</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Certification
        </Button>
      </div>

      {certifications.length === 0 && !showForm ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Award className="mx-auto h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-white">No certifications yet</h3>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Add your certifications to showcase your credentials.</p>
          <Button className="mt-6" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Certification
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certifications.map((cert, index) => {
            const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
            return (
              <Card key={cert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-badge-warning-bg text-badge-warning-text">
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-white">{cert.name}</h3>
                        <p className="text-xs text-zinc-500">{cert.organization}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                      <button onClick={() => moveItem(index, "down")} disabled={index === certifications.length - 1} className="rounded-md p-1 text-zinc-400 hover:text-muted-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                      <button onClick={() => openEdit(cert)} className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(cert.id)} className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Issued: {new Date(cert.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    </span>
                    {cert.expiryDate && (
                      <span className={cn("flex items-center gap-1", isExpired && "text-red-500")}>
                        {isExpired ? <AlertTriangle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                        Expires: {new Date(cert.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                      </span>
                    )}
                    {isExpired && (
                      <Badge variant="destructive" className="text-xs">Expired</Badge>
                    )}
                  </div>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Credential
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingId ? "Edit Certification" : "Add Certification"}
            </h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Certification Name</Label>
                <Input id="name" {...form.register("name")} placeholder="AWS Solutions Architect" />
                {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" {...form.register("organization")} placeholder="Amazon Web Services" />
                {form.formState.errors.organization && <p className="text-xs text-red-500">{form.formState.errors.organization.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input id="issueDate" type="date" {...form.register("issueDate")} />
                  {form.formState.errors.issueDate && <p className="text-xs text-red-500">{form.formState.errors.issueDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" {...form.register("expiryDate")} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credentialId">Credential ID</Label>
                  <Input id="credentialId" {...form.register("credentialId")} placeholder="AWS-12345" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credentialUrl">Credential URL</Label>
                  <Input id="credentialUrl" {...form.register("credentialUrl")} placeholder="https://credential.example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="certificateFile">Certificate File URL</Label>
                <Input id="certificateFile" {...form.register("certificateFile")} placeholder="https://example.com/certificate.pdf" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Delete Certification</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Are you sure you want to delete this certification?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800">Cancel</button>
              <button onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
