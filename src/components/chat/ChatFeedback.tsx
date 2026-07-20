"use client";

import { useState, useContext } from "react";
import { motion } from "framer-motion";
import { ChatContext } from "./ChatProvider";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ChatFeedbackProps {
  conversationId?: string;
  setFeedbackScore?: (score: number | null) => void;
}

export function ChatFeedback(props?: ChatFeedbackProps) {
  const t = useTranslations("chat");
  const ctx = useContext(ChatContext);
  const conversationId = props?.conversationId ?? ctx?.conversationId ?? null;
  const setFeedbackScore = props?.setFeedbackScore ?? ctx?.setFeedbackScore ?? (() => {});
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);


  const submitFeedback = async (score: number) => {
    if (!conversationId) return;
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          score,
          comment: comment || null,
          category: score >= 4 ? "positive" : score <= 2 ? "negative" : "neutral",
        }),
      });
      setFeedbackScore(score);
      setSubmitted(true);
    } catch {
      console.warn("Failed to submit feedback");
    }
  };

  const handleScoreClick = (score: number) => {
    setSelectedScore(score);
    setShowComment(true);
  };

  const handleCommentSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && selectedScore !== null) {
      submitFeedback(selectedScore);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-center"
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("feedback.thanks")}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 flex flex-col items-center gap-2"
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t("feedback.prompt")}
      </p>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            onClick={() => handleScoreClick(score)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all",
              score <= 2
                ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                : score === 3
                  ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400"
                  : "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
            )}
          >
            {score}
          </button>
        ))}
      </div>

      {showComment && (
        <div className="mt-2 flex w-full gap-2">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleCommentSubmit}
            placeholder={t("feedback.placeholder")}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        </div>
      )}
    </motion.div>
  );
}
