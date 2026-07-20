"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, TrendingUp, Loader2, Users, Mail } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-zinc-400" /></div>;
  }

  const stats = [
    { title: "Page Views", value: (data?.pageViews ?? 0).toLocaleString(), icon: Eye, trend: { value: 0, positive: true } },
    { title: "Total Events", value: (data?.totalEvents ?? 0).toLocaleString(), icon: TrendingUp, trend: undefined },
    { title: "Leads", value: (data?.leads ?? 0).toLocaleString(), icon: Users, trend: undefined },
    { title: "Subscribers", value: (data?.subscribers ?? 0).toLocaleString(), icon: Mail, trend: undefined },
  ];

  const eventBreakdown = data?.eventBreakdown || [];
  const dailyData = data?.dailyData || [];
  const topPages = data?.topPages || [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatsCard key={s.title} title={s.title} value={s.value} icon={s.icon} trend={s.trend} />
        ))}
      </div>

      {dailyData.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Daily Events (30 days)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} tickFormatter={(v) => v.slice(5)} />
                <YAxis stroke="#a1a1aa" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="page_view" stroke="#3b82f6" strokeWidth={2} dot={false} name="Page Views" />
                <Line type="monotone" dataKey="contact" stroke="#22c55e" strokeWidth={2} dot={false} name="Contacts" />
                <Line type="monotone" dataKey="newsletter_signup" stroke="#a855f7" strokeWidth={2} dot={false} name="Signups" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {eventBreakdown.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Event Breakdown</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventBreakdown} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
                  <YAxis type="category" dataKey="event" stroke="#a1a1aa" fontSize={12} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {topPages.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-white">Popular Pages</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
                  <YAxis type="category" dataKey="page" stroke="#a1a1aa" fontSize={12} width={140} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
