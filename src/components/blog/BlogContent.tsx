"use client";

import { useEffect, useRef } from "react";

function embedUrlForProvider(type: string, url: string): string | null {
  if (type === "twitter") {
    const m = url.match(/twitter\.com\/\w+\/status\/(\d+)/) || url.match(/x\.com\/\w+\/status\/(\d+)/);
    return m ? `https://platform.twitter.com/embed/Tweet.html?id=${m[1]}` : null;
  }
  if (type === "instagram") {
    const m = url.match(/instagram\.com\/p\/([^/?]+)/);
    return m ? `https://www.instagram.com/p/${m[1]}/embed` : null;
  }
  if (type === "codepen") {
    const m = url.match(/codepen\.io\/(\w+)\/pen\/(\w+)/);
    return m ? `https://codepen.io/${m[1]}/embed/${m[2]}?default-tab=result` : null;
  }
  return null;
}

const PROVIDERS = [
  { attr: "data-twitter-embed", type: "twitter" },
  { attr: "data-instagram-embed", type: "instagram" },
  { attr: "data-codepen-embed", type: "codepen" },
];

export function BlogContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    for (const { attr, type } of PROVIDERS) {
      const cards = el.querySelectorAll<HTMLDivElement>(`[${attr}]`);
      for (const card of cards) {
        const textEl = card.querySelector(".embed-card__text");
        if (!textEl) continue;
        const url = textEl.textContent?.trim();
        if (!url) continue;
        const embedUrl = embedUrlForProvider(type, url);
        if (!embedUrl) continue;
        const iframe = document.createElement("iframe");
        iframe.src = embedUrl;
        iframe.className = "embed-iframe";
        iframe.style.cssText = "width:100%;border:0;border-radius:8px;aspect-ratio:16/9;";
        iframe.setAttribute("allowfullscreen", "");
        iframe.loading = "lazy";
        card.replaceWith(iframe);
      }
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose prose-zinc mx-auto dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
