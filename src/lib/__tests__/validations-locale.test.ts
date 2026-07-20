import { describe, it, expect } from "vitest";
import {
  languageSchema,
  languageUpdateSchema,
  translationGroupSchema,
  translationSchema,
  bulkImportSchema,
  localeSettingsSchema,
} from "../validations/locale";

describe("languageSchema", () => {
  it("parses valid language", () => {
    const result = languageSchema.parse({
      code: "en",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
    });
    expect(result.code).toBe("en");
    expect(result.name).toBe("English");
    expect(result.direction).toBe("LTR");
    expect(result.isEnabled).toBe(true);
    expect(result.isDefault).toBe(false);
    expect(result.order).toBe(0);
  });

  it("rejects missing code", () => {
    const result = languageSchema.safeParse({
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid locale code", () => {
    const result = languageSchema.safeParse({
      code: "english",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
    });
    expect(result.success).toBe(false);
  });

  it("accepts locale code with region", () => {
    const result = languageSchema.parse({
      code: "en-US",
      name: "English (US)",
      nameEn: "English (US)",
      nativeName: "English (US)",
      direction: "LTR",
    });
    expect(result.code).toBe("en-US");
  });

  it("rejects invalid direction", () => {
    const result = languageSchema.safeParse({
      code: "en",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "TOP",
    });
    expect(result.success).toBe(false);
  });

  it("parses with all optional fields", () => {
    const result = languageSchema.parse({
      code: "zh",
      name: "Chinese",
      nameEn: "Chinese",
      nativeName: "\u4e2d\u6587",
      direction: "LTR",
      flagEmoji: "\ud83c\udde8\ud83c\uddf3",
      flagImage: "https://example.com/flag.svg",
      isEnabled: true,
      isDefault: false,
      fallbackLocale: "en",
      order: 1,
    });
    expect(result.flagEmoji).toBe("\ud83c\udde8\ud83c\uddf3");
    expect(result.flagImage).toBe("https://example.com/flag.svg");
    expect(result.fallbackLocale).toBe("en");
    expect(result.order).toBe(1);
  });

  it("rejects code too short", () => {
    const result = languageSchema.safeParse({
      code: "e",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects code too long", () => {
    const result = languageSchema.safeParse({
      code: "en_USA",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty flagEmoji", () => {
    const result = languageSchema.parse({
      code: "en",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
      flagEmoji: "",
    });
    expect(result.flagEmoji).toBe("");
  });

  it("rejects flagEmoji over 10 chars", () => {
    const result = languageSchema.safeParse({
      code: "en",
      name: "English",
      nameEn: "English",
      nativeName: "English",
      direction: "LTR",
      flagEmoji: "A".repeat(11),
    });
    expect(result.success).toBe(false);
  });
});

describe("languageUpdateSchema", () => {
  it("parses empty object", () => {
    const result = languageUpdateSchema.parse({});
    expect(result).toEqual({
      isDefault: false,
      isEnabled: true,
      order: 0,
    });
  });

  it("parses partial data", () => {
    const result = languageUpdateSchema.parse({ name: "English Updated" });
    expect(result.name).toBe("English Updated");
  });
});

describe("translationGroupSchema", () => {
  it("parses valid translation group", () => {
    const result = translationGroupSchema.parse({
      name: "General",
      slug: "general",
    });
    expect(result.name).toBe("General");
    expect(result.slug).toBe("general");
    expect(result.order).toBe(0);
  });

  it("rejects missing name", () => {
    const result = translationGroupSchema.safeParse({ slug: "general" });
    expect(result.success).toBe(false);
  });

  it("rejects missing slug", () => {
    const result = translationGroupSchema.safeParse({ name: "General" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = translationGroupSchema.safeParse({
      name: "General",
      slug: "General Stuff",
    });
    expect(result.success).toBe(false);
  });

  it("accepts description", () => {
    const result = translationGroupSchema.parse({
      name: "General",
      slug: "general",
      description: "General translations",
    });
    expect(result.description).toBe("General translations");
  });

  it("rejects name over 200 chars", () => {
    const result = translationGroupSchema.safeParse({
      name: "N".repeat(201),
      slug: "general",
    });
    expect(result.success).toBe(false);
  });
});

describe("translationSchema", () => {
  it("parses valid translation", () => {
    const result = translationSchema.parse({
      groupId: "group_1",
      key: "welcome.message",
      languageId: "lang_1",
    });
    expect(result.groupId).toBe("group_1");
    expect(result.key).toBe("welcome.message");
    expect(result.languageId).toBe("lang_1");
    expect(result.needsReview).toBe(false);
  });

  it("rejects missing groupId", () => {
    const result = translationSchema.safeParse({
      key: "test",
      languageId: "lang_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing key", () => {
    const result = translationSchema.safeParse({
      groupId: "group_1",
      languageId: "lang_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid key characters", () => {
    const result = translationSchema.safeParse({
      groupId: "group_1",
      key: "hello world!",
      languageId: "lang_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects key over 500 chars", () => {
    const result = translationSchema.safeParse({
      groupId: "group_1",
      key: "k".repeat(501),
      languageId: "lang_1",
    });
    expect(result.success).toBe(false);
  });

  it("accepts value, pluralForm, context", () => {
    const result = translationSchema.parse({
      groupId: "group_1",
      key: "test",
      value: "Hello",
      languageId: "lang_1",
      pluralForm: "Hello",
      context: "Formal",
    });
    expect(result.value).toBe("Hello");
    expect(result.pluralForm).toBe("Hello");
    expect(result.context).toBe("Formal");
  });
});

describe("bulkImportSchema", () => {
  it("parses valid bulk import", () => {
    const result = bulkImportSchema.parse({
      languageId: "lang_1",
      groupId: "group_1",
      translations: [
        { key: "hello", value: "Hello" },
        { key: "bye", value: "Goodbye" },
      ],
    });
    expect(result.languageId).toBe("lang_1");
    expect(result.groupId).toBe("group_1");
    expect(result.overwrite).toBe(false);
    expect(result.translations).toHaveLength(2);
  });

  it("rejects missing languageId", () => {
    const result = bulkImportSchema.safeParse({
      groupId: "group_1",
      translations: [{ key: "hello" }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty translations array", () => {
    const result = bulkImportSchema.parse({
      languageId: "lang_1",
      groupId: "group_1",
      translations: [],
    });
    expect(result.translations).toEqual([]);
  });

  it("applies default value for translation items", () => {
    const result = bulkImportSchema.parse({
      languageId: "lang_1",
      groupId: "group_1",
      translations: [{ key: "hello" }],
    });
    expect(result.translations[0].value).toBe("");
  });
});

describe("localeSettingsSchema", () => {
  it("parses empty object", () => {
    const result = localeSettingsSchema.parse({});
    expect(result).toEqual({});
  });

  it("parses all fields", () => {
    const result = localeSettingsSchema.parse({
      autoDetect: true,
      localePrefix: "always",
      cookieName: "locale",
      enableTranslationApi: true,
      translationApiProvider: "google",
      translationApiKey: "abc123",
    });
    expect(result.autoDetect).toBe(true);
    expect(result.localePrefix).toBe("always");
    expect(result.cookieName).toBe("locale");
    expect(result.enableTranslationApi).toBe(true);
    expect(result.translationApiProvider).toBe("google");
    expect(result.translationApiKey).toBe("abc123");
  });

  it("rejects invalid localePrefix", () => {
    const result = localeSettingsSchema.safeParse({
      localePrefix: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string for translationApiProvider and translationApiKey", () => {
    const result = localeSettingsSchema.parse({
      translationApiProvider: "",
      translationApiKey: "",
    });
    expect(result.translationApiProvider).toBe("");
    expect(result.translationApiKey).toBe("");
  });
});
