import { defineRouting } from "next-intl/routing";

export const locales = [
  "en",
  "fr",
  "es",
  "pt",
  "ar",
  "de",
  "it",
  "zh",
  "ja",
  "ko",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale = "en" as const;

export const localeNames: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  pt: "Português",
  ar: "العربية",
  de: "Deutsch",
  it: "Italiano",
  zh: "中文",
  ja: "日本語",
  ko: "한국어",
};

export const localeDirections: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  fr: "ltr",
  es: "ltr",
  pt: "ltr",
  ar: "rtl",
  de: "ltr",
  it: "ltr",
  zh: "ltr",
  ja: "ltr",
  ko: "ltr",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  es: "🇪🇸",
  pt: "🇵🇹",
  ar: "🇸🇦",
  de: "🇩🇪",
  it: "🇮🇹",
  zh: "🇨🇳",
  ja: "🇯🇵",
  ko: "🇰🇷",
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "never",
  localeDetection: true,
});
