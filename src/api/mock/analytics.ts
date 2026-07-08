import type { AnalyticsPayload, AnalyticsPoint, Period } from "../types";

/*
 * In-memory mock of the analytics module (build-demo-screen-catalog). Shapes
 * mirror the API DTO (../types) exactly, so a real analytics backend can drop
 * in without touching the screen. Series are deterministic pseudo-random so the
 * charts look alive but stay stable across reloads. Amounts are major units +
 * an ISO currency code (see src/lib/money.ts).
 */

const CURRENCY = "USD";

/** Deterministic pseudo-random series so charts look alive but stable across reloads. */
function series(
  len: number,
  base: number,
  spread: number,
  seed: number,
): number[] {
  const out: number[] = [];
  let state = seed;
  for (let i = 0; i < len; i++) {
    state = (state * 1103515245 + 12345) % 2147483648;
    out.push(
      Math.max(
        0,
        Math.round(
          base + (state / 2147483648 - 0.5) * spread + i * (spread / len / 2),
        ),
      ),
    );
  }
  return out;
}

/** Bucket shape per preset: how many points and how many days each point spans. */
function periodShape(period: Period): { count: number; stepDays: number } {
  switch (period) {
    case "week":
      return { count: 7, stepDays: 1 };
    case "quarter":
      return { count: 13, stepDays: 7 }; // weekly buckets — bounded, not 90 daily points
    case "month":
    default:
      return { count: 30, stepDays: 1 };
  }
}

/** DD.MM labels aligned to the bucket span (mirrors the dashboard mock convention). */
function bucketLabels(period: Period): string[] {
  const { count, stepDays } = periodShape(period);
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * stepDays * 24 * 3600 * 1000);
    out.push(
      `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return out;
}

/** Flow-total multiplier: how much a per-week total grows across the preset window. */
const PERIOD_FACTOR: Record<Period, number> = {
  week: 1,
  month: 4,
  quarter: 13,
};

function money(base: number): number {
  return Math.round(base * 100) / 100;
}

/** Build the whole analytics payload for a period (single endpoint, one query). */
export function getAnalytics(period: Period): AnalyticsPayload {
  const { count, stepDays } = periodShape(period);
  const labels = bucketLabels(period);
  const revenue = series(count, 1800 * stepDays, 900 * stepDays, 41);
  const sessions = series(count, 520 * stepDays, 260 * stepDays, 17);
  const revenue_series: AnalyticsPoint[] = labels.map((label, i) => ({
    label,
    revenue: money(revenue[i]!),
    sessions: sessions[i]!,
  }));

  const factor = PERIOD_FACTOR[period];
  const totalRevenue = money(revenue.reduce((sum, value) => sum + value, 0));
  const totalSessions = sessions.reduce((sum, value) => sum + value, 0);

  return {
    period,
    currency: CURRENCY,
    kpis: {
      sessions: { value: totalSessions, delta: 0.082 },
      revenue: { value: totalRevenue, delta: 0.124 },
      // conversion + AOV are ratios/averages — they don't scale with the window.
      conversion: { value: 0.0314, delta: -0.021 },
      aov: {
        value: money(
          totalSessions > 0 ? totalRevenue / (totalSessions * 0.0314) : 0,
        ),
        delta: 0.046,
      },
    },
    revenue_series,
    channels: [
      { name: "organic", value: money(3200 * factor) },
      { name: "direct", value: money(2100 * factor) },
      { name: "referral", value: money(1400 * factor) },
      { name: "social", value: money(980 * factor) },
      { name: "email", value: money(620 * factor) },
    ],
    top_products: [
      { name: "Aurora Desk Lamp", value: money(4200 * factor) },
      { name: "Nimbus Wireless Headphones", value: money(3600 * factor) },
      { name: "Vega Mechanical Keyboard", value: money(2900 * factor) },
      { name: "Drift Bluetooth Speaker", value: money(2400 * factor) },
      { name: "Cobalt Travel Backpack", value: money(1800 * factor) },
    ],
    funnel: [
      { key: "visits", value: Math.round(totalSessions) },
      { key: "product_views", value: Math.round(totalSessions * 0.62) },
      { key: "add_to_cart", value: Math.round(totalSessions * 0.28) },
      { key: "checkout", value: Math.round(totalSessions * 0.11) },
      { key: "purchase", value: Math.round(totalSessions * 0.031) },
    ],
  };
}
