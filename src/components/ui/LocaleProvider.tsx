"use client";

import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, locales } from "@/i18n/routing";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import esMessages from "@/messages/es.json";
import ptMessages from "@/messages/pt.json";
import arMessages from "@/messages/ar.json";
import deMessages from "@/messages/de.json";
import itMessages from "@/messages/it.json";
import zhMessages from "@/messages/zh.json";
import jaMessages from "@/messages/ja.json";
import koMessages from "@/messages/ko.json";

const messagesMap: Record<string, Record<string, unknown>> = {
  en: enMessages, fr: frMessages, es: esMessages, pt: ptMessages,
  ar: arMessages, de: deMessages, it: itMessages,
  zh: zhMessages, ja: jaMessages, ko: koMessages,
};

function getLocaleFromCookie(): string {
  if (typeof document === "undefined") return defaultLocale;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  const locale = match?.[1];
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
  return locale && locales.includes(locale as any) ? locale : defaultLocale;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = getLocaleFromCookie();
  const messages = messagesMap[locale] || messagesMap[defaultLocale];

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="America/New_York">
      {children}
    </NextIntlClientProvider>
  );
}
