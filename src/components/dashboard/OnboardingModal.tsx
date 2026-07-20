"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Users,
  Layers,
  Mail,
  Calendar,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";

interface Step {
  id: number;
  title: string;
  icon: typeof Rocket;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Welcome to Your Dashboard",
    icon: Rocket,
    description:
      "This is your command center for managing your portfolio, leads, projects, newsletter, and more. Let's take a quick tour of the key features.",
  },
  {
    id: 2,
    title: "Leads & CRM",
    icon: Users,
    description:
      "Track incoming leads from your contact form, manage client relationships, and convert prospects into projects. The CRM keeps everything organized in one place.",
    actionLabel: "View Leads",
    actionHref: "/dashboard/leads",
  },
  {
    id: 3,
    title: "Portfolio & Content",
    icon: Layers,
    description:
      "Showcase your work with portfolio projects, publish blog posts, list your services, and manage testimonials — all from the dashboard.",
    actionLabel: "Manage Portfolio",
    actionHref: "/dashboard/portfolio",
  },
  {
    id: 4,
    title: "Newsletter & Campaigns",
    icon: Mail,
    description:
      "Build your email list, create campaigns with beautiful templates, segment subscribers, and track open rates, click rates, and engagement.",
    actionLabel: "Open Newsletter",
    actionHref: "/dashboard/newsletter",
  },
  {
    id: 5,
    title: "Calendar & Appointments",
    icon: Calendar,
    description:
      "Sync with Google Calendar or Outlook, manage your availability, accept bookings, and keep track of events and deadlines.",
    actionLabel: "Open Calendar",
    actionHref: "/dashboard/calendar/settings",
  },
  {
    id: 6,
    title: "You're All Set!",
    icon: CheckCircle2,
    description:
      "You now have full access to the dashboard. Explore the sidebar to manage every aspect of your online presence. If you need help, check the settings page.",
  },
];

export function OnboardingModal() {
  const t = useTranslations("dashboard");
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          setOpen(!data.completed);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      await fetch("/api/onboarding", { method: "PATCH" });
    } catch {
    }
    setOpen(false);
  }, []);

  const dismiss = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const handleSkip = () => {
    if (currentStep < 5) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    dismiss();
  };

  if (loading || !open) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === 5;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label={t("closeOnboarding")}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-8">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-2 w-2 rounded-full transition-all duration-300",
                i === currentStep
                  ? "w-6 bg-blue-600"
                  : i < currentStep
                    ? "bg-green-500"
                    : "bg-zinc-200 dark:bg-zinc-700"
              )}
            />
          ))}
        </div>

        <div className="px-8 py-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg">
            <Icon className="h-8 w-8" />
          </div>

          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {step.title}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
            {step.description}
          </p>

          {step.actionLabel && step.actionHref && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleNavigate(step.actionHref!)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
              >
                <Sparkles className="h-4 w-4" />
                {step.actionLabel}
              </button>
            </div>
          )}

          {isLastStep && (
            <div className="mt-6 text-center">
              <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                What you can do now:
              </p>
              <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-zinc-500 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Manage leads and client relationships</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Publish portfolio projects and blog posts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Send newsletters and email campaigns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Sync calendars and accept bookings</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            {!isLastStep && !isFirstStep && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
            )}
            {isFirstStep && (
              <button
                onClick={dismiss}
                className="text-sm text-zinc-400 transition-colors hover:text-muted-foreground dark:hover:text-zinc-300"
              >
                Skip tour
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <button
                onClick={handleSkip}
                className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors",
                isLastStep
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:from-brand-500 hover:to-brand-600"
              )}
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
