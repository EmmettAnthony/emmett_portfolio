"use client";

import { ArrowUpRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { cn } from "@/lib/utils";

interface CtaButton {
  text: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: "primary" | "secondary";
  /** Full className override for the button. Overrides variant defaults. */
  className?: string;
  /** If true, opens link in a new tab */
  external?: boolean;
}

interface CtaSectionProps {
  title: string;
  description: string;
  /** Optional icon displayed above the title */
  icon?: LucideIcon;
  /** Primary call-to-action button */
  primaryButton: CtaButton;
  /** Optional secondary buttons */
  secondaryButtons?: CtaButton[];
  /** Overlay gradient color scheme: "blue-purple" | "amber" | "none" */
  overlay?: "blue-purple" | "amber" | "none";
  /** Whether to show decorative border circles */
  showDecoration?: boolean;
  /** Additional className for the outer section */
  className?: string;
}

const overlayGradients = {
  "blue-purple": "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
  amber: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
  none: "",
} as const;

export function CtaSection({
  title,
  description,
  icon: Icon,
  primaryButton,
  secondaryButtons,
  overlay = "blue-purple",
  showDecoration = true,
  className,
}: CtaSectionProps) {
  const ButtonComp = (btn: CtaButton, idx: number) => {
    const isPrimary = btn.variant !== "secondary";
    const IconComponent = btn.icon;

    const classes = cn(
      "inline-flex h-12 items-center gap-2 rounded-xl px-6 text-sm font-semibold transition-all",
      isPrimary
        ? "bg-white text-zinc-900 shadow-lg hover:bg-zinc-100 hover:shadow-xl"
        : "border border-zinc-600 bg-transparent text-white hover:bg-zinc-800",
      btn.className
    );

    const linkProps = btn.external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};

    if (btn.onClick) {
      return (
        <button key={idx} onClick={btn.onClick} className={classes}>
          {IconComponent && <IconComponent className="h-4 w-4" />}
          {btn.text}
          {!IconComponent && <ArrowUpRight className="h-4 w-4" />}
        </button>
      );
    }

    return (
      <Link key={idx} href={btn.href || "#"} {...linkProps} className={classes}>
        {IconComponent && <IconComponent className="h-4 w-4" />}
        {btn.text}
        {!IconComponent && <ArrowUpRight className="h-4 w-4" />}
      </Link>
    );
  };

  return (
    <section className={cn("py-20 md:py-28", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-8 py-16 text-center sm:px-16 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            {/* Overlay gradient */}
            {overlay !== "none" && (
              <div className={cn("pointer-events-none absolute inset-0", overlayGradients[overlay])} />
            )}

            {/* Decorative background pattern */}
            {showDecoration && (
              <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
                <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full border-[20px] border-white" />
                <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full border-[20px] border-white" />
              </div>
            )}

            <div className="relative">
              {Icon && (
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                  <Icon className="h-7 w-7 text-white" />
                </div>
              )}

              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {title}
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-400">
                {description}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                {ButtonComp(primaryButton, 0)}
                {secondaryButtons?.map((btn, i) => ButtonComp({ ...btn, variant: "secondary" }, i + 1))}
              </div>
            </div>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
