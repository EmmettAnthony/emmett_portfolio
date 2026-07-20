"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const statusIcons: Record<string, React.ReactNode> = {
  CONFIRMED: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  PENDING: <Clock className="h-4 w-4 text-amber-500" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-500" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
};
// used indirectly via statusColors mapping
void statusIcons;

const statusColors: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-badge-warning-bg text-badge-warning-text",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  COMPLETED: "bg-badge-info-bg text-badge-info-text",
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/appointments");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast("success", "Appointment updated");
    },
    onError: () => toast("error", "Failed to update"),
  });

  const appointments = data?.appointments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Appointments</h1>
          <p className="text-sm text-zinc-500">{isLoading ? "Loading..." : `${data?.pagination?.total || 0} total`}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-zinc-400" /></div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Calendar className="mb-2 h-8 w-8" />
          <p>No appointments yet</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {appointments.map((a: { id: string; name: string; email: string; phone: string | null; date: string; duration: number; notes: string | null; status: string; createdAt: string }) => (
            <div key={a.id} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{a.name}</h3>
                  {a.email && <p className="text-xs text-zinc-500">{a.email}</p>}
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusColors[a.status])}>
                  {a.status}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground dark:text-zinc-400">
                <p className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(a.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                  {" at "}
                  {new Date(a.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {a.duration} min
                </p>
                {a.phone && <p className="text-xs text-zinc-500">{a.phone}</p>}
              </div>
              {a.notes && (
                <p className="mt-2 text-xs text-zinc-500 line-clamp-2">{a.notes}</p>
              )}
              <div className="mt-3 flex gap-1">
                {a.status === "PENDING" && (
                  <>
                    <button onClick={() => updateMutation.mutate({ id: a.id, status: "CONFIRMED" })}
                      className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                      Confirm
                    </button>
                    <button onClick={() => updateMutation.mutate({ id: a.id, status: "CANCELLED" })}
                      className="rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                      Cancel
                    </button>
                  </>
                )}
                {a.status === "CONFIRMED" && (
                  <button onClick={() => updateMutation.mutate({ id: a.id, status: "COMPLETED" })}
                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400">
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
