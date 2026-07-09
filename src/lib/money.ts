import type { AdminLocale } from "@/lib/i18n";

/*
 * Shared money/number formatting for the demo commerce screens (orders, products,
 * customers, payments, invoices, pricing). Amounts are stored as major units
 * (dollars, not cents) with an ISO currency code on the DTO — the same contract a
 * real backend would return. Rendering routes through Intl so it follows the
 * active admin locale (grouping, symbol placement).
 */

export function formatMoney(
  amount: number,
  currency: string,
  locale: AdminLocale,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact figure for stat tiles / KPI rows (e.g. "1.2K", "3.4M"). */
export function formatCompactMoney(
  amount: number,
  currency: string,
  locale: AdminLocale,
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatNumber(value: number, locale: AdminLocale): string {
  return new Intl.NumberFormat(locale).format(value);
}
