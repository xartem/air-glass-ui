import type {
  BlogDashboardPayload,
  CrmDashboardPayload,
  CryptoDashboardPayload,
  DashboardPayloadMap,
  DashboardVertical,
  EcommerceDashboardPayload,
  JobsDashboardPayload,
  NftDashboardPayload,
  OhlcPoint,
  Period,
  ProjectsDashboardPayload,
  SeriesPoint,
} from "../types";

/*
 * In-memory mock of the dashboard verticals (build-w2-screens-dashboard-verticals).
 * One typed payload per (vertical, period) via getDashboard(). Series are
 * deterministic pseudo-random (same seed → same shape across reloads) so charts
 * look alive but stay stable, mirroring src/api/mock/analytics.ts. Money is in
 * major units + an ISO currency code (see src/lib/money.ts); categorical labels
 * come back as i18n leaf keys the page resolves through t().
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

/** Short axis-less KPI sparkline; trends up for a non-negative delta, down otherwise. */
function kpiSpark(delta: number, seed: number): number[] {
  const points = series(10, 100, 44, seed);
  return delta >= 0 ? points : points.slice().reverse();
}

/** Bucket shape per preset: how many points and how many days each point spans. */
function periodShape(period: Period): { count: number; stepDays: number } {
  switch (period) {
    case "week":
      return { count: 7, stepDays: 1 };
    case "quarter":
      return { count: 13, stepDays: 7 };
    case "month":
    default:
      return { count: 30, stepDays: 1 };
  }
}

/** DD.MM labels aligned to the bucket span (mirrors the analytics mock convention). */
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

/** Flow-total multiplier: how much a per-week figure grows across the preset window. */
const PERIOD_FACTOR: Record<Period, number> = {
  week: 1,
  month: 4,
  quarter: 13,
};

function money(base: number): number {
  return Math.round(base * 100) / 100;
}

function trend(
  period: Period,
  base: number,
  spread: number,
  seed: number,
): SeriesPoint[] {
  const { count, stepDays } = periodShape(period);
  const labels = bucketLabels(period);
  const values = series(count, base * stepDays, spread * stepDays, seed);
  return labels.map((label, i) => ({ label, value: values[i]! }));
}

function moneyTrend(
  period: Period,
  base: number,
  spread: number,
  seed: number,
): SeriesPoint[] {
  return trend(period, base, spread, seed).map((point) => ({
    ...point,
    value: money(point.value),
  }));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Deterministic future ISO timestamp N minutes ahead (auction countdowns). */
function inMinutes(min: number): string {
  return new Date(Date.now() + min * 60 * 1000).toISOString();
}

/** Deterministic past ISO timestamp N hours ago (activity feeds). */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

/** ISO date N days from today (deadlines / due dates). */
function inDays(d: number): string {
  return new Date(Date.now() + d * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

function getCrm(period: Period): CrmDashboardPayload {
  const factor = PERIOD_FACTOR[period];
  const leads = Math.round(180 * factor);
  const won = Math.round(48 * factor);
  const revenue = money(64_000 * factor);
  return {
    period,
    currency: CURRENCY,
    kpis: {
      leads: { value: leads, delta: 0.112, spark: kpiSpark(0.112, 101) },
      dealsWon: { value: won, delta: 0.064, spark: kpiSpark(0.064, 102) },
      revenue: { value: revenue, delta: 0.093, spark: kpiSpark(0.093, 103) },
      conversion: {
        value: won / Math.max(1, leads),
        delta: 0.018,
        spark: kpiSpark(0.018, 104),
      },
    },
    trend: moneyTrend(period, 9_000, 4_000, 53),
    touches: {
      channels: ["email", "call", "meeting", "demo"].map(
        (channel) => `dash.crm.touches.${channel}`,
      ),
      values: [0, 1, 2, 3].map((row) => series(7, 22 + row * 6, 26, 60 + row)),
    },
    funnel: [
      { label: "lead", value: leads },
      { label: "qualified", value: Math.round(leads * 0.68) },
      { label: "proposal", value: Math.round(leads * 0.41) },
      { label: "negotiation", value: Math.round(leads * 0.24) },
      { label: "won", value: won },
    ],
    pipeline: [
      { label: "Maria Ilić", value: money(21_400 * factor) },
      { label: "Tom Becker", value: money(18_900 * factor) },
      { label: "Priya Nair", value: money(15_200 * factor) },
      { label: "Diego Alvarez", value: money(12_600 * factor) },
      { label: "Sara Lund", value: money(9_800 * factor) },
    ],
    activities: [
      {
        id: 1,
        task: "crm.activity.call",
        contact: "Nova Retail",
        due: inDays(0),
      },
      {
        id: 2,
        task: "crm.activity.demo",
        contact: "Halcyon Labs",
        due: inDays(1),
      },
      {
        id: 3,
        task: "crm.activity.follow_up",
        contact: "Beacon Group",
        due: inDays(2),
      },
      {
        id: 4,
        task: "crm.activity.proposal",
        contact: "Verta Foods",
        due: inDays(3),
      },
      {
        id: 5,
        task: "crm.activity.contract",
        contact: "Orbit Media",
        due: inDays(4),
      },
    ],
    leaders: [
      {
        name: "Maria Ilić",
        metric: money(21_400 * factor),
        quota: money(24_000 * factor),
      },
      {
        name: "Tom Becker",
        metric: money(18_900 * factor),
        quota: money(24_000 * factor),
      },
      {
        name: "Priya Nair",
        metric: money(15_200 * factor),
        quota: money(20_000 * factor),
      },
      {
        name: "Diego Alvarez",
        metric: money(12_600 * factor),
        quota: money(20_000 * factor),
      },
    ],
  };
}

function getEcommerce(period: Period): EcommerceDashboardPayload {
  const factor = PERIOD_FACTOR[period];
  const revenueSeries = moneyTrend(period, 1900, 900, 41);
  const totalRevenue = money(sum(revenueSeries.map((point) => point.value)));
  const orders = Math.round(320 * factor);
  return {
    period,
    currency: CURRENCY,
    kpis: {
      revenue: {
        value: totalRevenue,
        delta: 0.124,
        spark: kpiSpark(0.124, 111),
      },
      orders: { value: orders, delta: 0.081, spark: kpiSpark(0.081, 112) },
      aov: {
        value: money(totalRevenue / Math.max(1, orders)),
        delta: 0.032,
        spark: kpiSpark(0.032, 113),
      },
      refunds: {
        value: Math.round(orders * 0.04),
        delta: -0.015,
        spark: kpiSpark(-0.015, 114),
      },
    },
    revenue: revenueSeries,
    salesHeatmap: {
      hours: ["00", "03", "06", "09", "12", "15", "18", "21"],
      values: [0, 1, 2, 3, 4, 5, 6].map((day) =>
        series(8, 40 + (day % 6) * 8, 60, 70 + day),
      ),
    },
    categories: [
      { label: "electronics", value: money(9_200 * factor) },
      { label: "apparel", value: money(6_400 * factor) },
      { label: "home", value: money(4_800 * factor) },
      { label: "beauty", value: money(3_100 * factor) },
      { label: "sports", value: money(2_200 * factor) },
    ],
    recentOrders: [
      {
        id: 1042,
        code: "#1042",
        customer: "Ada Lovelace",
        total: money(248.9),
        status: "processing",
      },
      {
        id: 1041,
        code: "#1041",
        customer: "Grace Hopper",
        total: money(129.0),
        status: "shipped",
      },
      {
        id: 1040,
        code: "#1040",
        customer: "Alan Turing",
        total: money(512.5),
        status: "delivered",
      },
      {
        id: 1039,
        code: "#1039",
        customer: "Katherine Johnson",
        total: money(89.99),
        status: "pending",
      },
      {
        id: 1038,
        code: "#1038",
        customer: "Linus Pauling",
        total: money(64.2),
        status: "refunded",
      },
    ],
    topProducts: [
      { label: "Aurora Desk Lamp", value: money(4_200 * factor) },
      { label: "Nimbus Headphones", value: money(3_600 * factor) },
      { label: "Vega Keyboard", value: money(2_900 * factor) },
      { label: "Drift Speaker", value: money(2_400 * factor) },
      { label: "Cobalt Backpack", value: money(1_800 * factor) },
    ],
    sources: [
      { label: "organic", value: Math.round(4_200 * factor) },
      { label: "direct", value: Math.round(2_600 * factor) },
      { label: "social", value: Math.round(1_900 * factor) },
      { label: "referral", value: Math.round(1_200 * factor) },
      { label: "email", value: Math.round(760 * factor) },
    ],
  };
}

const CRYPTO_COINS: Array<{
  id: string;
  name: string;
  symbol: string;
  price: number;
  seed: number;
}> = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", price: 64_200, seed: 7 },
  { id: "eth", name: "Ethereum", symbol: "ETH", price: 3_180, seed: 13 },
  { id: "sol", name: "Solana", symbol: "SOL", price: 148, seed: 29 },
  { id: "ada", name: "Cardano", symbol: "ADA", price: 0.62, seed: 51 },
  { id: "dot", name: "Polkadot", symbol: "DOT", price: 7.4, seed: 83 },
];

function getCrypto(period: Period): CryptoDashboardPayload {
  const { count } = periodShape(period);
  const coins = CRYPTO_COINS.map((coin, index) => {
    const spark = series(16, coin.price, coin.price * 0.12, coin.seed);
    const change24h =
      (((coin.seed % 9) - 4) / 100) * (index % 2 === 0 ? 1 : -1);
    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price: coin.price,
      change24h,
      spark,
    };
  });
  const ohlcValues = series(count, 64_000, 4_800, 61);
  const labels = bucketLabels(period);
  const ohlc: OhlcPoint[] = labels.map((label, i) => {
    const open = ohlcValues[i]!;
    const close = ohlcValues[i + 1] ?? open * 1.01;
    const high = Math.max(open, close) + open * 0.012;
    const low = Math.min(open, close) - open * 0.011;
    return { label, open, high: money(high), low: money(low), close };
  });
  const volumeValues = series(count, 1_400, 900, 67);
  const volumes: SeriesPoint[] = labels.map((label, i) => ({
    label,
    value: volumeValues[i]!,
  }));
  return {
    period,
    currency: CURRENCY,
    portfolio: { value: money(184_920), delta: 0.037 },
    coins,
    marketCap: [
      { label: "Bitcoin", value: 1_260_000 },
      { label: "Ethereum", value: 382_000 },
      { label: "Solana", value: 68_000 },
      { label: "Cardano", value: 22_000 },
      { label: "Polkadot", value: 11_000 },
      { label: "Others", value: 47_000 },
    ],
    pair: "BTC/USD",
    ohlc,
    volumes,
    activity: [
      {
        id: 1,
        side: "buy",
        asset: "BTC",
        amount: money(0.42),
        at: hoursAgo(2),
      },
      {
        id: 2,
        side: "sell",
        asset: "ETH",
        amount: money(3.1),
        at: hoursAgo(5),
      },
      { id: 3, side: "buy", asset: "SOL", amount: money(48), at: hoursAgo(9) },
      {
        id: 4,
        side: "buy",
        asset: "DOT",
        amount: money(120),
        at: hoursAgo(20),
      },
      {
        id: 5,
        side: "sell",
        asset: "ADA",
        amount: money(900),
        at: hoursAgo(28),
      },
    ],
    watchlist: coins.map((coin) => ({
      symbol: coin.symbol,
      name: coin.name,
      price: coin.price,
      change24h: coin.change24h,
    })),
  };
}

function getProjects(period: Period): ProjectsDashboardPayload {
  const { count } = periodShape(period);
  const start = 320;
  const remaining = series(count, start, 40, 19)
    .map((value, i) =>
      Math.max(
        0,
        Math.round(start - (start / count) * i - (value - start) * 0.05),
      ),
    )
    .sort((a, b) => b - a);
  const burndown = bucketLabels(period).map((label, i) => ({
    label,
    remaining: remaining[i]!,
    ideal: Math.max(0, Math.round(start - (start / (count - 1)) * i)),
  }));
  return {
    period,
    currency: CURRENCY,
    kpis: {
      active: { value: 24, delta: 0.09, spark: kpiSpark(0.09, 121) },
      completed: { value: 138, delta: 0.14, spark: kpiSpark(0.14, 122) },
      overdue: { value: 6, delta: -0.2, spark: kpiSpark(-0.2, 123) },
      teamLoad: { value: 0.78, delta: 0.05, spark: kpiSpark(0.05, 124) },
    },
    burndown,
    statusSplit: [
      { label: "todo", value: 42 },
      { label: "in_progress", value: 28 },
      { label: "review", value: 14 },
      { label: "done", value: 138 },
    ],
    durations: [
      { label: "design", min: 1, q1: 2, median: 3, q3: 5, max: 9 },
      { label: "build", min: 2, q1: 4, median: 6, q3: 10, max: 18 },
      { label: "review", min: 1, q1: 1, median: 2, q3: 3, max: 6 },
      { label: "qa", min: 1, q1: 2, median: 3, q3: 4, max: 8 },
    ],
    projects: [
      { id: 1, name: "Apollo Redesign", progress: 0.82, deadline: inDays(6) },
      { id: 2, name: "Orbit Mobile App", progress: 0.54, deadline: inDays(12) },
      {
        id: 3,
        name: "Helix Data Platform",
        progress: 0.37,
        deadline: inDays(21),
      },
      {
        id: 4,
        name: "Nova Marketing Site",
        progress: 0.91,
        deadline: inDays(3),
      },
      { id: 5, name: "Ember Billing", progress: 0.22, deadline: inDays(30) },
    ],
    workload: [
      { label: "Maria Ilić", value: 12 },
      { label: "Tom Becker", value: 9 },
      { label: "Priya Nair", value: 8 },
      { label: "Diego Alvarez", value: 6 },
      { label: "Sara Lund", value: 4 },
    ],
    activity: [
      {
        id: 1,
        title: "projects.activity.merged",
        meta: "Apollo Redesign",
        at: hoursAgo(1),
        kind: "success",
      },
      {
        id: 2,
        title: "projects.activity.comment",
        meta: "Orbit Mobile App",
        at: hoursAgo(4),
        kind: "info",
      },
      {
        id: 3,
        title: "projects.activity.overdue",
        meta: "Ember Billing",
        at: hoursAgo(8),
        kind: "warning",
      },
      {
        id: 4,
        title: "projects.activity.created",
        meta: "Helix Data Platform",
        at: hoursAgo(26),
        kind: "default",
      },
    ],
  };
}

function getNft(period: Period): NftDashboardPayload {
  const factor = PERIOD_FACTOR[period];
  return {
    period,
    token: "ETH",
    currency: CURRENCY,
    kpis: {
      floor: { value: money(2.4), delta: 0.062, spark: kpiSpark(0.062, 131) },
      volume: {
        value: money(1_280 * factor),
        delta: 0.145,
        spark: kpiSpark(0.145, 132),
      },
      sales: {
        value: Math.round(940 * factor),
        delta: 0.088,
        spark: kpiSpark(0.088, 133),
      },
      wallets: {
        value: Math.round(3_200 * factor),
        delta: 0.041,
        spark: kpiSpark(0.041, 134),
      },
    },
    volume: trend(period, 180, 90, 37).map((point) => ({
      ...point,
      value: money(point.value / 10),
    })),
    marketShare: [
      { label: "Nebula Apes", value: 3_200 },
      { label: "Glass Golems", value: 2_600 },
      { label: "Pixel Voyagers", value: 1_800 },
      { label: "Aether Runes", value: 1_100 },
      { label: "Chromatic Cats", value: 900 },
      { label: "Others", value: 1_400 },
    ],
    collections: [
      { id: 1, name: "Nebula Apes", floor: money(3.2), change24h: 0.084 },
      { id: 2, name: "Pixel Voyagers", floor: money(1.8), change24h: -0.031 },
      { id: 3, name: "Chromatic Cats", floor: money(0.9), change24h: 0.052 },
      { id: 4, name: "Glass Golems", floor: money(2.6), change24h: 0.019 },
      { id: 5, name: "Aether Runes", floor: money(1.1), change24h: -0.012 },
    ],
    auctions: [
      {
        id: 1,
        name: "Nebula Ape #482",
        bid: money(4.1),
        endsAt: inMinutes(18),
      },
      {
        id: 2,
        name: "Glass Golem #77",
        bid: money(2.9),
        endsAt: inMinutes(46),
      },
      {
        id: 3,
        name: "Aether Rune #219",
        bid: money(1.6),
        endsAt: inMinutes(92),
      },
      {
        id: 4,
        name: "Pixel Voyager #12",
        bid: money(3.4),
        endsAt: inMinutes(150),
      },
    ],
    creators: [
      {
        name: "0xLuma",
        metric: money(420 * factor),
        quota: money(500 * factor),
      },
      {
        name: "VaporWave",
        metric: money(360 * factor),
        quota: money(500 * factor),
      },
      {
        name: "NyxStudio",
        metric: money(280 * factor),
        quota: money(400 * factor),
      },
      {
        name: "PrismLab",
        metric: money(210 * factor),
        quota: money(400 * factor),
      },
    ],
  };
}

function getJobs(period: Period): JobsDashboardPayload {
  const factor = PERIOD_FACTOR[period];
  const applicants = Math.round(640 * factor);
  return {
    period,
    kpis: {
      openRoles: { value: 32, delta: 0.06, spark: kpiSpark(0.06, 141) },
      applicants: {
        value: applicants,
        delta: 0.118,
        spark: kpiSpark(0.118, 142),
      },
      hires: {
        value: Math.round(28 * factor),
        delta: 0.07,
        spark: kpiSpark(0.07, 143),
      },
      timeToFill: { value: 24, delta: -0.09, spark: kpiSpark(-0.09, 144) },
    },
    applications: trend(period, 90, 50, 23),
    departments: [
      { label: "engineering", value: Math.round(240 * factor) },
      { label: "sales", value: Math.round(160 * factor) },
      { label: "marketing", value: Math.round(120 * factor) },
      { label: "design", value: Math.round(80 * factor) },
      { label: "support", value: Math.round(60 * factor) },
    ],
    salaries: [
      {
        label: "engineering",
        min: 90_000,
        q1: 120_000,
        median: 145_000,
        q3: 175_000,
        max: 220_000,
      },
      {
        label: "sales",
        min: 60_000,
        q1: 80_000,
        median: 100_000,
        q3: 130_000,
        max: 180_000,
      },
      {
        label: "marketing",
        min: 55_000,
        q1: 70_000,
        median: 85_000,
        q3: 105_000,
        max: 140_000,
      },
      {
        label: "design",
        min: 65_000,
        q1: 82_000,
        median: 98_000,
        q3: 118_000,
        max: 150_000,
      },
      {
        label: "support",
        min: 45_000,
        q1: 55_000,
        median: 65_000,
        q3: 78_000,
        max: 95_000,
      },
    ],
    pipeline: [
      { label: "applied", value: applicants },
      { label: "screening", value: Math.round(applicants * 0.52) },
      { label: "interview", value: Math.round(applicants * 0.24) },
      { label: "offer", value: Math.round(applicants * 0.09) },
      { label: "hired", value: Math.round(applicants * 0.045) },
    ],
    applicants: [
      {
        id: 1,
        name: "Noah Kim",
        role: "jobs.role.frontend",
        stage: "interview",
      },
      {
        id: 2,
        name: "Emma García",
        role: "jobs.role.designer",
        stage: "screening",
      },
      { id: 3, name: "Liam Novak", role: "jobs.role.backend", stage: "offer" },
      { id: 4, name: "Olivia Rossi", role: "jobs.role.pm", stage: "applied" },
      { id: 5, name: "Ava Dubois", role: "jobs.role.data", stage: "hired" },
    ],
  };
}

function getBlog(period: Period): BlogDashboardPayload {
  const factor = PERIOD_FACTOR[period];
  const viewsSeries = trend(period, 2_400, 1_100, 47);
  return {
    period,
    kpis: {
      posts: {
        value: Math.round(18 * factor),
        delta: 0.05,
        spark: kpiSpark(0.05, 151),
      },
      views: {
        value: sum(viewsSeries.map((point) => point.value)),
        delta: 0.132,
        spark: kpiSpark(0.132, 152),
      },
      subscribers: {
        value: Math.round(1_240 + 120 * factor),
        delta: 0.061,
        spark: kpiSpark(0.061, 153),
      },
      comments: {
        value: Math.round(320 * factor),
        delta: 0.028,
        spark: kpiSpark(0.028, 154),
      },
    },
    views: viewsSeries,
    engagement: {
      weeks: ["1", "2", "3", "4", "5", "6"],
      values: [0, 1, 2, 3, 4, 5].map((week) =>
        series(7, 30 + week * 5, 44, 90 + week),
      ),
    },
    categories: [
      { label: "tutorials", value: Math.round(3_800 * factor) },
      { label: "product", value: Math.round(2_600 * factor) },
      { label: "engineering", value: Math.round(2_100 * factor) },
      { label: "company", value: Math.round(1_200 * factor) },
      { label: "design", value: Math.round(900 * factor) },
    ],
    topPosts: [
      {
        id: 1,
        title: "Designing for dark mode",
        views: Math.round(4_800 * factor),
      },
      {
        id: 2,
        title: "Shipping a design system",
        views: Math.round(3_900 * factor),
      },
      {
        id: 3,
        title: "The state of web performance",
        views: Math.round(3_100 * factor),
      },
      {
        id: 4,
        title: "Accessible charts from scratch",
        views: Math.round(2_400 * factor),
      },
      {
        id: 5,
        title: "A guide to token theming",
        views: Math.round(1_700 * factor),
      },
    ],
    comments: [
      {
        id: 1,
        author: "Ada Lovelace",
        excerpt: "This clarified so much, thank you!",
        at: hoursAgo(3),
      },
      {
        id: 2,
        author: "Grace Hopper",
        excerpt: "Would love a follow-up on tooling.",
        at: hoursAgo(7),
      },
      {
        id: 3,
        author: "Alan Turing",
        excerpt: "The examples are excellent.",
        at: hoursAgo(14),
      },
      {
        id: 4,
        author: "Katherine Johnson",
        excerpt: "Bookmarked for the team.",
        at: hoursAgo(22),
      },
    ],
    authors: [
      { name: "Maria Ilić", metric: Math.round(12_800 * factor) },
      { name: "Tom Becker", metric: Math.round(9_400 * factor) },
      { name: "Priya Nair", metric: Math.round(7_200 * factor) },
      { name: "Diego Alvarez", metric: Math.round(5_100 * factor) },
    ],
  };
}

const BUILDERS: {
  [V in DashboardVertical]: (period: Period) => DashboardPayloadMap[V];
} = {
  crm: getCrm,
  ecommerce: getEcommerce,
  crypto: getCrypto,
  projects: getProjects,
  nft: getNft,
  jobs: getJobs,
  blog: getBlog,
};

/** Build the payload for one vertical + period (single endpoint, one query). */
export function getDashboard<V extends DashboardVertical>(
  vertical: V,
  period: Period,
): DashboardPayloadMap[V] {
  return BUILDERS[vertical](period);
}

export const DASHBOARD_VERTICALS = Object.keys(BUILDERS) as DashboardVertical[];

export function isDashboardVertical(value: string): value is DashboardVertical {
  return (DASHBOARD_VERTICALS as string[]).includes(value);
}
