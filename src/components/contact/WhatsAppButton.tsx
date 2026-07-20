"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";
import { useTranslations } from "@/lib/i18n";

export function WhatsAppButton() {
  const t = useTranslations("contact");
  const settings = useSiteSettings();
  const whatsappUrl = `https://wa.me/${settings.phone}?text=${encodeURIComponent(
    "Hi Emmett, I would like to discuss a project with you."
  )}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all hover:bg-green-600 hover:shadow-xl hover:scale-110 active:scale-95"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 1,
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      aria-label={t("whatsapp")}
    >
      <MessageCircle className="h-7 w-7" />
    </motion.a>
  );
}
