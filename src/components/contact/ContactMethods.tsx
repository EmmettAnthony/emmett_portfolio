"use client";

import { motion } from "framer-motion";
import {
  Mail,
  MessageCircle,
  Calendar,
  ArrowUpRight,
} from "lucide-react";
import { GithubIcon, LinkedInIcon } from "@/components/ui/SocialIcons";
import { useTranslations } from "@/lib/i18n";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";

interface ContactMethod {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  color: string;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export function ContactMethods() {
  const t = useTranslations();
  const settings = useSiteSettings();

  const methods: ContactMethod[] = [
    {
      icon: Mail,
      title: t("contact.methods.email.title"),
      description: t("contact.methods.email.description"),
      actionLabel: t("contact.methods.email.action"),
      href: `mailto:${settings.email}?subject=Project%20Inquiry`,
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: MessageCircle,
      title: t("contact.methods.whatsapp.title"),
      description: t("contact.methods.whatsapp.description"),
      actionLabel: t("contact.methods.whatsapp.action"),
      href: `https://wa.me/${settings.phone}?text=Hi%20Emmett%2C%20I%27d%20like%20to%20discuss%20a%20project`,
      color: "from-green-500 to-green-600",
    },
    {
      icon: LinkedInIcon,
      title: t("contact.methods.linkedin.title"),
      description: t("contact.methods.linkedin.description"),
      actionLabel: t("contact.methods.linkedin.action"),
      href: settings.social.linkedin,
      color: "from-blue-600 to-blue-700",
    },
    {
      icon: GithubIcon,
      title: t("contact.methods.github.title"),
      description: t("contact.methods.github.description"),
      actionLabel: t("contact.methods.github.action"),
      href: settings.social.github,
      color: "from-zinc-700 to-zinc-900 dark:from-zinc-500 dark:to-zinc-400",
    },
    {
      icon: Calendar,
      title: t("contact.methods.meeting.title"),
      description: t("contact.methods.meeting.description"),
      actionLabel: t("contact.methods.meeting.action"),
      href: "#",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AnimateOnScroll>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              {t("contact.otherWaysToConnect")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              {t("contact.chooseChannel")}
            </p>
          </div>
        </AnimateOnScroll>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
        >
          {methods.map((method) => (
            <motion.a
              key={method.title}
              variants={cardVariants}
              href={method.href}
              target={method.href.startsWith("http") ? "_blank" : undefined}
              rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-xl hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Gradient accent */}
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${method.color}`}
              />

              <div className="flex h-full flex-col">
                <div
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${method.color} text-white shadow-sm`}
                >
                  <method.icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-white">
                  {method.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400 flex-1">
                  {method.description}
                </p>

                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 transition-all group-hover:gap-2 dark:text-blue-400">
                  {method.actionLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
