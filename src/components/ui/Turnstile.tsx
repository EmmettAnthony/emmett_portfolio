"use client";

import { Turnstile as TurnstileWidget } from "@marsidev/react-turnstile";

interface TurnstileProps {
  onSuccess: (token: string) => void;
}

export function Turnstile({ onSuccess }: TurnstileProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return (
    <TurnstileWidget
      siteKey={siteKey}
      onSuccess={onSuccess}
      options={{
        theme: "auto",
      }}
    />
  );
}
