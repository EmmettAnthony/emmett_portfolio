"use client";

import { Mail, Phone, MapPin, MessageCircle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ContactCard {
  label: string;
  value: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function QuickContactCards({ className }: { className?: string }) {
  const t = useTranslations("contact");

  const contactCards: ContactCard[] = [
    {
      label: t("info.email"),
      value: "emmettanthony998@gmail.com",
      href: "mailto:emmettanthony998@gmail.com",
      icon: Mail,
    },
    {
      label: t("info.phone"),
      value: "+231 775 623 283",
      href: "tel:+231775623283",
      icon: Phone,
    },
    {
      label: t("info.location"),
      value: "Congo Town, Liberia",
      href: "https://maps.google.com/?q=Congo+Town+Liberia",
      icon: MapPin,
    },
    {
      label: "WhatsApp",
      value: "Chat with me",
      href: "https://wa.me/231775623283",
      icon: MessageCircle,
    },
  ];

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {contactCards.map((card) => {
        const Icon = card.icon;
        return (
          <a
            key={card.label}
            href={card.href}
            target={card.href.startsWith("http") ? "_blank" : undefined}
            rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-900/30 dark:text-blue-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {card.label}
              </p>
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                {card.value}
              </p>
            </div>
            <ExternalLink className="h-4 w-4 flex-shrink-0 text-zinc-300 transition-colors group-hover:text-blue-600 dark:text-muted-foreground" />
          </a>
        );
      })}
    </div>
  );
}
