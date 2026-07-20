"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "@/lib/i18n";

export function HeroTypewriter({ texts }: { texts?: string[] }) {
  const t = useTranslations("home.hero");
  const defaultTexts = [
    t("typewriter1"),
    t("typewriter2"),
    t("typewriter3"),
    t("typewriter4"),
  ];
  const typingTexts = (texts && texts.length > 0) ? texts : defaultTexts;
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(typingTexts[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;

    const currentText = typingTexts[textIndex];

    if (!isDeleting && charIndex === currentText.length) {
      pauseRef.current = setTimeout(() => setIsDeleting(true), 1500);
      return () => clearTimeout(pauseRef.current);
    }

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setCharIndex(charIndex + 1);
        } else {
          if (charIndex > 0) {
            setCharIndex(charIndex - 1);
          } else {
            setIsDeleting(false);
            const nextIndex = (textIndex + 1) % typingTexts.length;
            setTextIndex(nextIndex);
            setCharIndex(0);
          }
        }
      },
      isDeleting ? 40 : 80
    );

    return () => {
      clearTimeout(timeout);
      clearTimeout(pauseRef.current);
    };
  }, [charIndex, isDeleting, textIndex, started, typingTexts]);

  return (
    <div className="mt-4 h-10">
      <span className="text-xl text-zinc-700 dark:text-zinc-400 sm:text-2xl">
        {typingTexts[textIndex].substring(0, charIndex)}
      </span>
      <span className="ml-0.5 inline-block h-8 w-0.5 animate-pulse bg-blue-600" />
    </div>
  );
}
