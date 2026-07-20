import type { locales } from "@/i18n/routing";

export type LocaleCode = (typeof locales)[number];

export type LanguageDirection = "LTR" | "RTL";

export interface LanguageData {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  nativeName: string;
  direction: LanguageDirection;
  flagEmoji: string | null;
  flagImage: string | null;
  isEnabled: boolean;
  isDefault: boolean;
  fallbackLocale: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationGroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  languageId: string | null;
  createdAt: string;
  updatedAt: string;
  translations?: TranslationData[];
}

export interface TranslationData {
  id: string;
  groupId: string;
  key: string;
  value: string | null;
  languageId: string;
  languageCode?: string;
  pluralForm: string | null;
  context: string | null;
  isAutoTranslated: boolean;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocaleSettingData {
  id: string;
  autoDetect: boolean;
  localePrefix: string;
  cookieName: string;
  enableTranslationApi: boolean;
  translationApiProvider: string | null;
  translationApiKey: string | null;
  updatedAt: string;
}

export type LanguageFormValues = {
  code: string;
  name: string;
  nameEn: string;
  nativeName: string;
  direction: "LTR" | "RTL";
  flagEmoji?: string;
  flagImage?: string;
  isEnabled?: boolean;
  isDefault?: boolean;
  fallbackLocale?: string;
  order?: number;
};

export type TranslationFormValues = {
  groupId: string;
  key: string;
  value?: string;
  languageId: string;
  pluralForm?: string;
  context?: string;
  needsReview?: boolean;
};

export type TranslationGroupFormValues = {
  name: string;
  slug: string;
  description?: string;
  order?: number;
};
