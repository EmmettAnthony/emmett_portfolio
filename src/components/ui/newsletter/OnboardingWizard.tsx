"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  Mail,
  Filter,
  Send,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  icon: typeof Rocket;
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Welcome",
    icon: Rocket,
    description:
      "Welcome to the Newsletter Dashboard! Send campaigns, manage subscribers, and track analytics — all in one place.",
  },
  {
    id: 2,
    title: "Connect Sender",
    icon: Mail,
    description:
      "Configure your sender name and email in settings so your subscribers recognize your messages.",
  },
  {
    id: 3,
    title: "Create a Segment",
    icon: Filter,
    description:
      "Segments let you group subscribers by tags, location, or activity. Create your first segment to target the right audience.",
  },
  {
    id: 4,
    title: "First Campaign",
    icon: Send,
    description:
      "Create and send your first campaign. Choose a template, write your content, and send to a segment.",
  },
  {
    id: 5,
    title: "Done",
    icon: CheckCircle2,
    description:
      "You're all set! You can now send campaigns, manage subscribers, and track your newsletter performance.",
  },
];

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      try {
        const completed = localStorage.getItem("newsletter_onboarding_completed");
        if (completed === "true") {
          onClose();
        }
      } catch {}
    }
  }, [open, onClose]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem("newsletter_onboarding_completed", "true");
    } catch {}
    onClose();
  }, [onClose]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (!open) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-4 top-4 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-muted-foreground dark:hover:bg-zinc-800 dark:hover:text-muted-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 px-6 pb-0 pt-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i === currentStep &&
                    "bg-blue-600 text-white",
                  i < currentStep &&
                    "bg-badge-info-bg text-badge-info-text",
                  i > currentStep &&
                    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  s.id
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 w-8 rounded transition-colors",
                    i < currentStep
                      ? "bg-blue-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pb-2 pt-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
                currentStep === 0 && "bg-badge-info-bg text-badge-info-text",
                currentStep === 1 && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                currentStep === 2 && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                currentStep === 3 && "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
                currentStep === 4 && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              )}
            >
              <Icon className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {step.description}
            </p>
          </div>

          {/* Step-specific actions */}
          {currentStep === 1 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleNavigate("/dashboard/newsletter/settings")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
              >
                <Mail className="h-4 w-4" />
                Go to Settings
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleNavigate("/dashboard/newsletter/segments")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
              >
                <Filter className="h-4 w-4" />
                Go to Segments
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => handleNavigate("/dashboard/newsletter/campaigns/new")}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:from-brand-500 hover:to-brand-600"
              >
                <Send className="h-4 w-4" />
                Create Campaign
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="mt-6 text-center">
              <p className="mb-4 text-sm font-medium text-zinc-700 dark:text-muted-foreground">
                Summary
              </p>
              <ul className="mx-auto max-w-xs space-y-2 text-left text-sm text-zinc-500 dark:text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Sender name and email configured</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>Segments created to target your audience</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <span>First campaign ready to send</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
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
                className="text-sm text-zinc-400 transition-colors hover:text-muted-foreground dark:hover:text-muted-foreground"
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
