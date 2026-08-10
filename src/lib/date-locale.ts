import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";

import type { AdminLocale } from "@/lib/i18n";

/*
 * The one place the UI locale maps onto a date-fns locale. Screens that format
 * relative or calendar dates read from here instead of rebuilding the map —
 * the same single-source rule the navigation map follows.
 *
 * Plain module, not a hook, so it works from render and from event handlers
 * alike. Pair it with `useLocale()` when the result is rendered, so the screen
 * re-formats after a language switch.
 */
export const DATE_LOCALES: Record<AdminLocale, typeof ru> = {
  ru,
  en: enUS,
  uk,
  de,
  fr,
  es,
  it,
  pl,
  ar,
};

/** date-fns locale for a UI locale, falling back to English. */
export function dateLocale(locale: AdminLocale) {
  return DATE_LOCALES[locale] ?? enUS;
}
