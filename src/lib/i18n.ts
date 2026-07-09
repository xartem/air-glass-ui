import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import it from "@/locales/it.json";
import pl from "@/locales/pl.json";
import ru from "@/locales/ru.json";
import uk from "@/locales/uk.json";

/*
 * Admin UI i18n (E2 §9): flat JSON dictionaries bundled into the SPA.
 * UI language is a per-user preference, independent from content locales (C1).
 * Hardcoded strings in components are forbidden — always use t('key').
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
] as const;
export type AdminLocale = (typeof ADMIN_LOCALES)[number];

/** Native language names (endonyms) for the UI-locale switcher. */
export const LOCALE_NAMES: Record<AdminLocale, string> = {
  ru: "Русский",
  uk: "Українська",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pl: "Polski",
};

const dictionaries: Record<AdminLocale, Record<string, string>> = {
  ru,
  uk,
  en,
  de,
  fr,
  es,
  it,
  pl,
};

const STORAGE_KEY = "admin.ui_locale";

let currentLocale: AdminLocale = (() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return ADMIN_LOCALES.includes(stored as AdminLocale)
    ? (stored as AdminLocale)
    : "en";
})();

const listeners = new Set<() => void>();

export function getLocale(): AdminLocale {
  return currentLocale;
}

export function setLocale(locale: AdminLocale): void {
  currentLocale = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  listeners.forEach((fn) => fn());
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
  const raw = dictionaries[currentLocale][key] ?? dictionaries.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in params ? String(params[name]) : m,
  );
}
