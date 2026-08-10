import en from "@/locales/en.json";

/*
 * Admin UI i18n: flat JSON dictionaries, one per locale.
 *
 * Only English is bundled into the main chunk — it is the fallback every lookup
 * can land on, so it must always be resident. The other eight load on demand,
 * as their own chunks, the first time a locale is selected. Bundling all nine
 * eagerly cost ~460 KB gzip on first paint for strings all but one visitor
 * never reads.
 *
 * `t()` stays synchronous: it is called during render across the whole app, so
 * the dictionary map is *populated* asynchronously rather than awaited at the
 * call site. A locale becomes current only once its dictionary is in memory,
 * which is what stops the UI painting raw keys and then jumping.
 *
 * Hardcoded UI strings are forbidden — always use t('key').
 */

// English is the primary UI language; the rest follow. ru/uk remain available.
export const ADMIN_LOCALES = [
  "en",
  "de",
  "fr",
  "es",
  "it",
  "pl",
  "ru",
  "uk",
  "ar",
] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];

/** Native language names (endonyms) for the UI-locale switcher. Never lazy —
 * the switcher lists every language without loading any of them. */
export const LOCALE_NAMES: Record<AdminLocale, string> = {
  ru: "Русский",
  uk: "Українська",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pl: "Polski",
  ar: "العربية",
};

type Dictionary = Record<string, string>;

// The JSON import carries a literal type per key; widen it once so lookups by a
// runtime string type-check.
const enDictionary = en as Dictionary;

const dictionaries: Partial<Record<AdminLocale, Dictionary>> = {
  en: enDictionary,
};

/** One dynamic import per locale, so each becomes its own chunk. */
const loaders: Record<
  Exclude<AdminLocale, "en">,
  () => Promise<{ default: Dictionary }>
> = {
  ar: () => import("@/locales/ar.json"),
  de: () => import("@/locales/de.json"),
  es: () => import("@/locales/es.json"),
  fr: () => import("@/locales/fr.json"),
  it: () => import("@/locales/it.json"),
  pl: () => import("@/locales/pl.json"),
  ru: () => import("@/locales/ru.json"),
  uk: () => import("@/locales/uk.json"),
};

const STORAGE_KEY = "admin.ui_locale";

function readStoredLocale(): AdminLocale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return ADMIN_LOCALES.includes(stored as AdminLocale)
      ? (stored as AdminLocale)
      : "en";
  } catch {
    return "en";
  }
}

let currentLocale: AdminLocale = "en";

const listeners = new Set<() => void>();

/**
 * Fetch a dictionary into memory. Resolves true once the locale is usable —
 * false when its chunk could not be loaded, so callers keep the current locale
 * rather than switching to one that would render as raw keys.
 */
async function loadDictionary(locale: AdminLocale): Promise<boolean> {
  if (dictionaries[locale]) return true;
  const loader = loaders[locale as Exclude<AdminLocale, "en">];
  if (!loader) return false;
  try {
    dictionaries[locale] = (await loader()).default;
    return true;
  } catch {
    // A missing chunk must degrade to English, never throw into render.
    return false;
  }
}

/**
 * Resolve the stored locale before the first render. Without this the app would
 * paint English (or raw keys) and then swap once the dictionary arrived.
 */
export async function initLocale(): Promise<void> {
  const stored = readStoredLocale();
  if (stored === "en") return;
  if (await loadDictionary(stored)) currentLocale = stored;
}

export function getLocale(): AdminLocale {
  return currentLocale;
}

/**
 * Switch language. The dictionary is loaded first and subscribers are notified
 * only afterwards, so a render never sees a locale whose strings are missing.
 * Persisting also waits on success — a locale that failed to load should not be
 * restored on the next visit.
 */
export function setLocale(locale: AdminLocale): void {
  if (locale === currentLocale) return;
  void loadDictionary(locale).then((ok) => {
    if (!ok) return;
    currentLocale = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Private-mode storage failures must not block the language switch.
    }
    listeners.forEach((fn) => fn());
  });
}

/** Subscribe to locale changes (used by useLocale); returns unsubscribe. */
export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Translate a key with optional {placeholder} params. Missing key falls back to the key itself. */
export function t(
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[currentLocale] ?? enDictionary;
  const raw = dict[key] ?? enDictionary[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}
