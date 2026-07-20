"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface ChatSuggestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
}

export function ChatSuggestions({ questions, onSelect }: ChatSuggestionsProps) {
  const t = useTranslations("chat");
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {t("suggestionsLabel")}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <motion.button
            key={q}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelect(q)}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
          >
            <Sparkles className="h-3 w-3" />
            {q}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
