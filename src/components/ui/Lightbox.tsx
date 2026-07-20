"use client";

import { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface LightboxProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const t = useTranslations("common");
  const [index, setIndex] = useState(initialIndex);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>

        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          className="relative h-full w-full max-h-screen max-w-6xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[index]}
            alt={t("galleryImage", { index: index + 1 })}
            fill
            className="object-contain p-4"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
            {index + 1} / {images.length}
          </div>
        </motion.div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
