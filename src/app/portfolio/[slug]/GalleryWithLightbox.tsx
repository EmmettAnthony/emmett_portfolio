"use client";

import { useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { Lightbox } from "@/components/ui/Lightbox";

interface GalleryWithLightboxProps {
  images: string[];
  projectTitle: string;
}

export function GalleryWithLightbox({ images, projectTitle }: GalleryWithLightboxProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image: string, index: number) => (
          <AnimateOnScroll key={index} delay={index * 0.05}>
            <button
              onClick={() => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
            >
              <Image
                src={image}
                alt={`${projectTitle} screenshot ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <span className="rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Search className="h-5 w-5 text-zinc-900" />
                </span>
              </div>
            </button>
          </AnimateOnScroll>
        ))}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
