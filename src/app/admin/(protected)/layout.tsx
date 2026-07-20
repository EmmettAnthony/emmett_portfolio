import { auth } from "@/../auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { OnboardingModal } from "@/components/dashboard/OnboardingModal";
import { Suspense } from "react";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <ToastProvider>
      <Toaster richColors closeButton />
      <ErrorBoundary>
        <div className="flex min-h-screen bg-background">
          <DashboardSidebar />
          <div className="flex flex-1 flex-col lg:pl-64">
            <DashboardHeader user={session.user} />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
        <Suspense fallback={null}>
          <OnboardingModal />
        </Suspense>
      </ErrorBoundary>
    </ToastProvider>
  );
}
