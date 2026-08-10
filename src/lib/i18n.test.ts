import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The i18n store keeps module-level state (current locale + loaded dictionaries),
 * so every case re-imports it fresh. English is bundled; the other eight arrive
 * through dynamic imports, which is the behaviour these tests pin down.
 *
 * Dictionaries are enumerated with import.meta.glob rather than node:fs — the app
 * tsconfig is browser-typed on purpose, and this still catches a locale file that
 * exists on disk but was never registered.
 */

const DICTIONARY_MODULES = import.meta.glob<Record<string, unknown>>(
  "../locales/*.json",
  { eager: true, import: "default" },
);

/** "../locales/de.json" -> "de" */
const localeOf = (filePath: string) =>
  filePath.slice(filePath.lastIndexOf("/") + 1).replace(".json", "");

const DICTIONARIES = Object.fromEntries(
  Object.entries(DICTIONARY_MODULES).map(([p, dict]) => [localeOf(p), dict]),
);

async function freshI18n() {
  vi.resetModules();
  localStorage.clear();
  return import("@/lib/i18n");
}

describe("t()", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("serves English before any other dictionary has loaded", async () => {
    const { t, getLocale } = await freshI18n();
    expect(getLocale()).toBe("en");
    expect(t("common.save")).toBe("Save");
  });

  it("serves the localized string once the dictionary is resident", async () => {
    const { t, setLocale } = await freshI18n();
    setLocale("de");
    await vi.waitFor(() => expect(t("common.save")).toBe("Speichern"));
  });

  it("falls back to the key itself when it exists in no dictionary", async () => {
    const { t } = await freshI18n();
    expect(t("nope.not.a.real.key")).toBe("nope.not.a.real.key");
  });

  it("interpolates {placeholder} params and leaves unknown ones intact", async () => {
    const { t } = await freshI18n();
    // Uses the key's own English text as the template source.
    expect(t("common.save", { unused: "x" })).toBe("Save");
    expect(t("{a} and {b}", { a: "1" })).toBe("1 and {b}");
  });
});

describe("setLocale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not switch until the dictionary is in memory", async () => {
    const { setLocale, getLocale } = await freshI18n();

    setLocale("de");
    // The whole point of the design: the locale must NOT flip synchronously, or
    // subscribers would re-render against strings that have not arrived.
    expect(getLocale()).toBe("en");

    await vi.waitFor(() => expect(getLocale()).toBe("de"));
  });

  it("notifies subscribers only after the switch has taken effect", async () => {
    const { setLocale, getLocale, onLocaleChange } = await freshI18n();

    const seen: string[] = [];
    const unsubscribe = onLocaleChange(() => seen.push(getLocale()));

    setLocale("ru");
    expect(seen).toEqual([]);

    await vi.waitFor(() => expect(seen).toEqual(["ru"]));
    unsubscribe();
  });

  it("stops notifying after unsubscribe", async () => {
    const { setLocale, onLocaleChange, getLocale } = await freshI18n();

    let calls = 0;
    const unsubscribe = onLocaleChange(() => calls++);
    unsubscribe();

    setLocale("fr");
    await vi.waitFor(() => expect(getLocale()).toBe("fr"));
    expect(calls).toBe(0);
  });

  it("persists the choice only once the load succeeded", async () => {
    const { setLocale, getLocale } = await freshI18n();
    expect(localStorage.getItem("admin.ui_locale")).toBeNull();

    setLocale("pl");
    await vi.waitFor(() => expect(getLocale()).toBe("pl"));
    expect(localStorage.getItem("admin.ui_locale")).toBe("pl");
  });

  it("ignores a switch to the locale already current", async () => {
    const { setLocale, onLocaleChange, getLocale } = await freshI18n();

    let calls = 0;
    const unsubscribe = onLocaleChange(() => calls++);

    setLocale("en");
    await Promise.resolve();
    expect(getLocale()).toBe("en");
    expect(calls).toBe(0);
    unsubscribe();
  });

  it("keeps the current locale when the dictionary cannot be loaded", async () => {
    vi.resetModules();
    localStorage.clear();
    vi.doMock("@/locales/it.json", () => {
      throw new Error("chunk unavailable");
    });

    const { setLocale, getLocale, t } = await import("@/lib/i18n");
    setLocale("it");

    // A failed chunk must degrade to English rather than throw into render or
    // strand the UI on a locale with no strings.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(getLocale()).toBe("en");
    expect(t("common.save")).toBe("Save");
    expect(localStorage.getItem("admin.ui_locale")).toBeNull();

    vi.doUnmock("@/locales/it.json");
  });
});

describe("initLocale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("resolves the stored locale before the first render", async () => {
    localStorage.setItem("admin.ui_locale", "uk");
    vi.resetModules();
    const { initLocale, getLocale, t } = await import("@/lib/i18n");

    await initLocale();
    expect(getLocale()).toBe("uk");
    // Already translated at this point — no key flash, no post-paint swap.
    expect(t("common.save")).not.toBe("Save");
  });

  it("ignores an unknown stored value and stays on English", async () => {
    localStorage.setItem("admin.ui_locale", "klingon");
    vi.resetModules();
    const { initLocale, getLocale } = await import("@/lib/i18n");

    await initLocale();
    expect(getLocale()).toBe("en");
  });
});

describe("locale catalogue", () => {
  it("exposes a display name for every supported locale", async () => {
    const { ADMIN_LOCALES, LOCALE_NAMES } = await freshI18n();
    for (const locale of ADMIN_LOCALES) {
      expect(LOCALE_NAMES[locale]).toBeTruthy();
    }
  });

  it("ships exactly one dictionary file per supported locale, and no orphans", async () => {
    const { ADMIN_LOCALES } = await freshI18n();
    expect(Object.keys(DICTIONARIES).sort()).toEqual([...ADMIN_LOCALES].sort());
  });
});

/*
 * The drift guard. Adding a screen means adding its keys to all nine
 * dictionaries; this is what fails the build when only eight were updated.
 */
describe("dictionary key parity", () => {
  const enKeys = Object.keys(DICTIONARIES.en).sort();
  const others = Object.keys(DICTIONARIES)
    .filter((locale) => locale !== "en")
    .sort();

  it("has a non-trivial English source dictionary", () => {
    expect(enKeys.length).toBeGreaterThan(3000);
  });

  it.each(others)("%s matches the English key set exactly", (locale) => {
    const keys = Object.keys(DICTIONARIES[locale]).sort();
    const missing = enKeys.filter((k) => !keys.includes(k));
    const extra = keys.filter((k) => !enKeys.includes(k));
    expect({ missing, extra }).toEqual({ missing: [], extra: [] });
  });

  it.each(others)("%s has no empty translations", (locale) => {
    const empty = Object.entries(DICTIONARIES[locale])
      .filter(([, value]) => typeof value !== "string" || value.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });
});
