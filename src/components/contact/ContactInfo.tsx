"use client";

import { Mail, MapPin } from "lucide-react";
import { GithubIcon, LinkedInIcon } from "@/components/ui/SocialIcons";
import { useTranslations } from "@/lib/i18n";
import type { SiteSettingsData } from "@/lib/get-site-settings";

export function ContactInfo({ settings }: { settings: SiteSettingsData }) {
  const t = useTranslations();
  const contactInfo = [
    {
      icon: Mail,
      label: t("contact.info.email"),
      value: settings.email,
      href: `mailto:${settings.email}`,
    },
    {
      icon: MapPin,
      label: t("contact.info.location"),
      value: settings.address,
    },
    {
      icon: GithubIcon,
      label: t("contact.info.github"),
      value: settings.social.github?.replace("https://", "") ?? "",
      href: settings.social.github,
    },
    {
      icon: LinkedInIcon,
      label: t("contact.info.linkedin"),
      value: settings.social.linkedin?.replace("https://", "") ?? "",
      href: settings.social.linkedin,
    },
  ];

  return (
    <>
      {contactInfo.map((info) => {
        const Icon = info.icon;
        const content = (
          <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground dark:text-zinc-400">
                {info.label}
              </h3>
              <p className="mt-0.5 text-sm font-medium text-zinc-900 dark:text-white">
                {info.value}
              </p>
            </div>
          </div>
        );

        if (info.href) {
          return (
            <a
              key={info.label}
              href={info.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content}
            </a>
          );
        }
        return <div key={info.label}>{content}</div>;
      })}
    </>
  );
}
