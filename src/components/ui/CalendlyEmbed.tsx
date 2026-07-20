"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Calendly?: {
      initPopupWidget: (options: { url: string }) => void;
    };
  }
}

const CALENDLY_URL = process.env.NEXT_PUBLIC_CALENDLY_URL;
const SCRIPT_ID = "calendly-widget-script";

export function useCalendly() {
  useEffect(() => {
    return () => {
      const existing = document.getElementById(SCRIPT_ID);
      existing?.remove();
    };
  }, []);

  const open = () => {
    if (!CALENDLY_URL) return;

    const existing = document.getElementById(SCRIPT_ID);

    if (existing && window.Calendly) {
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
      return;
    }

    if (existing) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => {
      window.Calendly?.initPopupWidget({ url: CALENDLY_URL });
    };
    document.body.appendChild(script);
  };

  return { openCalendly: open };
}