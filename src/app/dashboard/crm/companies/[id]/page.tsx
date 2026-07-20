"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  healthScore: number;
}

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  probability: number;
}

interface CompanyDetail {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  contacts: Contact[];
  deals: Deal[];
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();


  const { data: company, isLoading } = useQuery<CompanyDetail>({
    queryKey: ["crm-company", id],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/crm/companies/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!company) {
    return <div className="py-16 text-center text-sm text-zinc-500">Company not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{company.name}</h1>
          {company.industry && <p className="text-sm text-zinc-500">{company.industry}</p>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-zinc-500">Phone</p>
              <p className="font-medium text-zinc-900 dark:text-white">{company.phone || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Website</p>
              {company.website ? (
                <a href={company.website} target="_blank" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                  {company.website} <ExternalLink className="inline h-3 w-3" />
                </a>
              ) : <p className="font-medium text-zinc-900 dark:text-white">N/A</p>}
            </div>
            <div>
              <p className="text-zinc-500">Address</p>
              <p className="font-medium text-zinc-900 dark:text-white">{company.address || "N/A"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Created</p>
              <p className="font-medium text-zinc-900 dark:text-white">{new Date(company.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacts ({company.contacts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {company.contacts.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No contacts.</div>
            ) : (
              <div className="space-y-2">
                {company.contacts.map((contact) => (
                  <a
                    key={contact.id}
                    href={`/dashboard/crm/clients/${contact.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{contact.name}</p>
                      <p className="text-xs text-zinc-500">{contact.email}</p>
                    </div>
                    <span className={cn(
                      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                      contact.healthScore >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      contact.healthScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}>{contact.healthScore}</span>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deals ({company.deals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {company.deals.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No deals.</div>
            ) : (
              <div className="space-y-2">
                {company.deals.map((deal) => (
                  <a
                    key={deal.id}
                    href={`/dashboard/crm/deals/${deal.id}`}
                    className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{deal.name}</p>
                      <p className="text-xs text-zinc-500">{deal.stage.replace(/_/g, " ")} - {deal.probability}%</p>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">${deal.value.toLocaleString()}</p>
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
