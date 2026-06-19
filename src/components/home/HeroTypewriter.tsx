"use client";

import { useEffect, useState, useRef } from "react";

const typingTexts = [
  "Full Stack Developer",
  "UI/UX Enthusiast",
  "Open Source Contributor",
  "Problem Solver",
];

export function HeroTypewriter() {
  const [textIndex, setTextIndex] = useState(0);
  // Start with first text fully visible so it's never empty
  const [charIndex, setCharIndex] = useState(typingTexts[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Delay the start of the animation cycle so the user sees the first text
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
  }, [charIndex, isDeleting, textIndex, started]);

  return (
    <div className="mt-4 h-10">
      <span className="text-xl text-zinc-700 dark:text-zinc-400 sm:text-2xl">
        {typingTexts[textIndex].substring(0, charIndex)}
      </span>
      <span className="ml-0.5 inline-block h-8 w-0.5 animate-pulse bg-blue-600" />
    </div>
  );
}
