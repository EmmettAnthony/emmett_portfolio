"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useChat } from "./ChatProvider";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ChatBubble() {
  const t = useTranslations("chat");
  const { isOpen, toggle, unreadCount } = useChat();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {!isOpen && unreadCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 10 }}
            className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-lg dark:bg-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {unreadCount} {t("newMessage")}{unreadCount !== 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggle}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-shadow hover:shadow-2xl sm:h-14 sm:w-14",
          "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isOpen ? t("closeChat") : t("openChat")}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
