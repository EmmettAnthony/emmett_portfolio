import { useTranslations as useNextIntlTranslations } from "next-intl";

export function useTranslations(namespace?: string) {
  return useNextIntlTranslations(namespace);
}

export function t(key: string, fallback: string): string {
  return fallback;
}
