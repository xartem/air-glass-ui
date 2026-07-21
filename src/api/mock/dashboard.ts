import { formatDistanceToNow } from "date-fns";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";

import { getLocale, type AdminLocale } from "@/lib/i18n";
import { actionLabel, entityLabel, entityTitle } from "@/lib/activity-labels";
import { ApiError } from "../client";
import type {
  ActionLayoutOverride,
  ActivityEntry,
  DashboardAction,
  DashboardPayload,
  DashboardWidgetMeta,
  LayoutOverrides,
  Me,
  Period,
  WidgetData,
  WidgetLayoutOverride,
  WidgetSize,
  WidgetType,
} from "../types";
import { rolesStore } from "./roles";

/*
 * Mock of the dashboard module (D:dashboard §4/§6): the full v1 widget catalog
 * (UI:dashboard §3) + quick actions + per-role layout overrides. On the real
 * backend each widget is registered by its owning module in boot(); here the
 * registry is one table with fixture data() generators.
 */

const LAYOUTS_KEY = "mock.dashboardLayouts";
const SIZES: WidgetSize[] = ["sm", "md", "lg", "xl"];

const DATE_LOCALES: Record<AdminLocale, typeof ru> = {
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

function ago(date: Date | string): string {
  return formatDistanceToNow(new Date(date), {
    addSuffix: true,
    locale: DATE_LOCALES[getLocale()],
  });
}

/** Deterministic pseudo-random series so charts look alive but stable across reloads. */
function series(len: number, base: number, spread: number, seed = 7): number[] {
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

function days(count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 3600 * 1000);
    out.push(
      `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return out;
}

/* ---- period (D:dashboard §4): the window sets the aggregation range, never the
 * row/point budget. The server buckets the span so the series length stays
 * bounded — quarter yields ~13 weekly points, NOT 90 daily ones. ---- */

const PERIODS: Period[] = ["week", "month", "quarter"];

/** Server-side clamp: an unknown/missing period degrades to the default, never executed as-is. */
export function clampPeriod(raw: string | undefined): Period {
  return PERIODS.includes(raw as Period) ? (raw as Period) : "month";
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

/** number[] of the bucketed length (for stat sparklines). */
function bucketSeries(
  period: Period,
  base: number,
  spread: number,
  seed: number,
): number[] {
  return series(periodShape(period).count, base, spread, seed);
}

/** {x,y}[] of the bucketed length (for charts); base/spread scale with bucket width. */
function bucketPoints(
  period: Period,
  base: number,
  spread: number,
  seed: number,
): { x: string; y: number }[] {
  const { count, stepDays } = periodShape(period);
  const labels = bucketLabels(period);
  return series(count, base * stepDays, spread * stepDays, seed).map(
    (y, i) => ({ x: labels[i]!, y }),
  );
}

/** Flow-total multiplier: how much a per-week total grows across the preset window. */
const PERIOD_FACTOR: Record<Period, number> = {
  week: 1,
  month: 4,
  quarter: 13,
};

function usd(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

/** First letters of up to two name words — avatar fallback for list rows. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Extra data a widget fixture needs from the shared mock state (passed by the route layer). */
export interface WidgetContext {
  activity: ActivityEntry[];
}

interface MockWidget {
  key: string;
  title_key: string;
  permission: string;
  type: WidgetType;
  size: WidgetSize;
  sort: number;
  route: string | null;
  /** Lucide slug the owning module registers with the widget (D:dashboard §4). */
  icon: string;
  /** True → data() reacts to the period window; state widgets omit it and ignore the arg. */
  period_aware?: boolean;
  data: (ctx: WidgetContext, period: Period) => WidgetData;
}

/** Widget catalog — one demo widget per surviving admin area (shop, analytics, AI, media, activity). */
const WIDGETS: MockWidget[] = [
  {
    key: "orders.week",
    title_key: "orders.widget.week",
    permission: "orders.view",
    type: "chart",
    size: "lg",
    sort: 50,
    route: "/shop/orders",
    icon: "chart-column",
    period_aware: true,
    // Bucketed x-axis: quarter -> ~13 weekly bars, NOT 90 daily ones (window != budget).
    data: (_ctx, period) => ({
      kind: "bar",
      summary: { total: usd(312400 * PERIOD_FACTOR[period]), delta: 12 },
      reference: { y: 52, label_key: "dashboard.avg" },
      series: [
        {
          label_key: "orders.widget.series_orders",
          points: bucketPoints(period, 6, 6, 5),
        },
        {
          label_key: "orders.widget.series_revenue",
          points: bucketPoints(period, 52, 40, 17),
        },
      ],
    }),
  },
  {
    key: "orders.recent",
    title_key: "orders.widget.recent",
    permission: "orders.view",
    type: "list",
    size: "md",
    sort: 60,
    route: "/shop/orders",
    icon: "shopping-cart",
    data: () => ({
      items: [
        {
          title: "#1046 · $24,900",
          avatar: "IF",
          hint: "Irene Frost",
          url: "/shop/orders?id=1046",
          badge: "new",
        },
        {
          title: "#1045 · $12,400",
          avatar: "PM",
          hint: "Paul Morrison",
          url: "/shop/orders?id=1045",
          badge: "paid",
        },
        {
          title: "#1044 · $3,150",
          avatar: "MC",
          hint: "Mary Cooper",
          url: "/shop/orders?id=1044",
          badge: "paid",
        },
        {
          title: "#1043 · $41,700",
          avatar: "BS",
          hint: "BuildServ LLC",
          url: "/shop/orders?id=1043",
          badge: "shipped",
        },
        {
          title: "#1042 · $8,200",
          avatar: "DS",
          hint: "Daniel Sawyer",
          url: "/shop/orders?id=1042",
          badge: "done",
        },
        {
          title: "#1041 · $15,300",
          avatar: "AB",
          hint: "Anna Bell",
          url: "/shop/orders?id=1041",
          badge: "done",
        },
        {
          title: "#1040 · $6,750",
          avatar: "VK",
          hint: "Victor Kim",
          url: "/shop/orders?id=1040",
          badge: "done",
        },
        {
          title: "#1039 · $92,000",
          avatar: "AQ",
          hint: "Aquabuild LLC",
          url: "/shop/orders?id=1039",
          badge: "done",
        },
        {
          title: "#1038 · $4,400",
          avatar: "EG",
          hint: "Ellen Goss",
          url: "/shop/orders?id=1038",
          badge: "done",
        },
      ],
    }),
  },
  {
    key: "media.storage",
    title_key: "media.widget.storage",
    permission: "media.view",
    type: "status",
    size: "sm",
    sort: 85,
    route: "/media",
    icon: "hard-drive",
    data: () => ({
      rows: [
        {
          label_key: "media.widget.used",
          value: "1.2 GB",
          state: "ok" as const,
          url: "/media",
        },
        { label_key: "media.widget.files", value: "312", state: "ok" as const },
        {
          label_key: "media.widget.quota",
          value: "37% of 5 GB",
          state: "ok" as const,
        },
      ],
    }),
  },
  {
    key: "auth.activity",
    title_key: "activity.widget.title",
    permission: "activity.view",
    type: "list",
    size: "lg",
    sort: 100,
    route: "/system/activity",
    icon: "activity",
    data: (ctx) => ({
      items: ctx.activity.slice(0, 10).map((entry) => {
        const name = entry.is_ai ? "AI" : (entry.actor?.name ?? "—");
        // Show WHAT changed: "{action}: {subject}" as title, actor · entity-type · time as hint.
        return {
          title: `${actionLabel(entry.action)}: ${entityTitle(entry)}`,
          hint: `${name} · ${entityLabel(entry.entity_type)} · ${ago(entry.created_at)}`,
          url: entry.url ?? "/system/activity",
          ...(entry.is_ai
            ? { leadIcon: "sparkles" as const }
            : { avatar: initials(name) }),
        };
      }),
    }),
  },
  {
    key: "analytics.sessions",
    title_key: "analytics.widget.sessions",
    permission: "analytics.view",
    type: "chart",
    size: "md",
    sort: 140,
    route: "/analytics",
    icon: "chart-line",
    period_aware: true,
    data: (_ctx, period) => ({
      kind: "line",
      summary: {
        total: Math.round(3420 * PERIOD_FACTOR[period]).toLocaleString("en-US"),
        delta: 6,
      },
      reference: { y: 120, label_key: "dashboard.avg" },
      series: [
        {
          label_key: "analytics.widget.series_sessions",
          points: bucketPoints(period, 120, 70, 41),
        },
        {
          label_key: "dashboard.prev_period",
          points: bucketPoints(period, 108, 60, 61),
          dashed: true,
        },
      ],
    }),
  },
  {
    key: "analytics.users_today",
    title_key: "analytics.widget.users_today",
    permission: "analytics.view",
    type: "stat",
    size: "sm",
    sort: 150,
    route: "/analytics",
    icon: "users",
    data: () => ({
      value: 142,
      delta: -8,
      series: series(14, 130, 40, 29),
      series_labels: days(14),
      compare: { from: 154, to: 142 },
      goal: { target: 200, label_key: "dashboard.goal" },
    }),
  },
  {
    key: "analytics.top_pages",
    title_key: "analytics.widget.top_pages",
    permission: "analytics.view",
    type: "list",
    size: "md",
    sort: 160,
    route: "/analytics",
    icon: "trending-up",
    period_aware: true,
    // Period widens the window (views scale), but the list stays <=10 rows — window != budget.
    data: (_ctx, period) => {
      // Ranked leaderboard: each row carries a magnitude bar (share = views ÷
      // leader) so the list reads as a structured chart, not a flat name column.
      const pages: Array<{ title: string; path: string; views: number; delta?: number }> = [
        { title: "Home", path: "/", views: 2431, delta: 8 },
        { title: "Products", path: "/products", views: 1204, delta: 14 },
        { title: "Pricing", path: "/pricing", views: 862, delta: -3 },
        { title: "About", path: "/about", views: 514 },
        { title: "Contact", path: "/contact", views: 447, delta: 2 },
        { title: "Blog", path: "/blog", views: 391 },
        { title: "Getting Started", path: "/blog/getting-started", views: 356, delta: 22 },
        { title: "Documentation", path: "/docs", views: 298 },
        { title: "Shipping", path: "/shipping", views: 245 },
        { title: "Changelog", path: "/changelog", views: 203 },
      ];
      const max = Math.max(...pages.map((p) => p.views));
      return {
        variant: "ranked",
        items: pages.map((p) => {
          const views = Math.round(p.views * PERIOD_FACTOR[period]);
          return {
            title: p.title,
            hint: p.path,
            share: p.views / max,
            metric: {
              value: views.toLocaleString("en-US"),
              ...(p.delta !== undefined ? { delta: p.delta } : {}),
            },
          };
        }),
      };
    },
  },
  {
    key: "ai.spend",
    title_key: "ai.widget.spend",
    permission: "ai.manage",
    type: "stat",
    size: "sm",
    sort: 170,
    route: "/system/ai",
    icon: "sparkles",
    period_aware: true,
    // Flow total: spend accrues over the window.
    data: (_ctx, period) => {
      const f = PERIOD_FACTOR[period];
      return {
        value: `$${(4.2 * f).toFixed(2)}`,
        delta: 18,
        series: bucketSeries(period, 3, 4, 13),
        series_labels: bucketLabels(period),
        compare: {
          from: `$${(3.6 * f).toFixed(2)}`,
          to: `$${(4.2 * f).toFixed(2)}`,
        },
      };
    },
  },
];

/** Quick actions v1; label keys are reused from the Cmd-K palette. */
/** `sort` is the registration-default order (overridden per-role via layouts.actions). */
const ACTIONS: Array<DashboardAction & { permission: string; sort: number }> = [
  {
    key: "media.upload",
    label_key: "action.uploadMedia",
    icon: "image-plus",
    route: "/media?upload=1",
    permission: "media.manage",
    sort: 20,
  },
];

type MockAction = (typeof ACTIONS)[number];

/* ---- per-role layout overrides (settings key dashboard.layouts, D:dashboard §3) ---- */

function layouts(): Record<string, LayoutOverrides> {
  try {
    return JSON.parse(localStorage.getItem(LAYOUTS_KEY) ?? "{}") as Record<
      string,
      LayoutOverrides
    >;
  } catch {
    return {};
  }
}

function persistLayouts(all: Record<string, LayoutOverrides>): void {
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(all));
}

function requireManage(me: Me): void {
  if (!me.permissions.includes("dashboard.manage"))
    throw new ApiError(403, "Forbidden");
}

/** Permission set of a role; null → all (the system admin role, mirroring RoleMatrix). */
function rolePermissions(roleKey: string): Set<string> | null {
  const role = rolesStore().find((candidate) => candidate.key === roleKey);
  if (!role) throw new ApiError(422, "Unknown role", "unknown_role");
  return role.is_system ? null : new Set(role.permissions);
}

/** Normalized role layout: always both maps present (old flat/malformed storage degrades to defaults). */
type NormalizedLayout = {
  widgets: Record<string, WidgetLayoutOverride>;
  actions: Record<string, ActionLayoutOverride>;
};

function roleLayout(roleKey: string): NormalizedLayout {
  const raw = layouts()[roleKey];
  return { widgets: raw?.widgets ?? {}, actions: raw?.actions ?? {} };
}

function effective(
  widget: MockWidget,
  overrides: NormalizedLayout,
): Required<WidgetLayoutOverride> {
  const override = overrides.widgets[widget.key] ?? {};
  return {
    size: override.size ?? widget.size,
    sort: override.sort ?? widget.sort,
    hidden: override.hidden ?? false,
  };
}

function effectiveAction(
  action: MockAction,
  overrides: NormalizedLayout,
): Required<ActionLayoutOverride> {
  const override = overrides.actions[action.key] ?? {};
  return {
    sort: override.sort ?? action.sort,
    hidden: override.hidden ?? false,
  };
}

export function getDashboard(me: Me, roleParam?: string): DashboardPayload {
  const customize = roleParam !== undefined && roleParam !== "";
  if (customize) requireManage(me);

  const roleKey = customize ? roleParam : me.user.role.key;
  const permitted = customize
    ? rolePermissions(roleKey)
    : new Set(me.permissions);
  const overrides = roleLayout(roleKey);

  const widgets: DashboardWidgetMeta[] = WIDGETS.filter(
    (widget) => permitted === null || permitted.has(widget.permission),
  )
    .map((widget) => {
      const eff = effective(widget, overrides);
      const meta: DashboardWidgetMeta = {
        key: widget.key,
        title_key: widget.title_key,
        type: widget.type,
        size: eff.size,
        sort: eff.sort,
        route: widget.route,
        icon: widget.icon,
      };
      // Only period-aware widgets carry the flag — the SPA re-queries just those on a period switch.
      if (widget.period_aware) meta.period_aware = true;
      // Hidden widgets stay in the customize payload (flagged) so the panel can restore them.
      if (customize) meta.hidden = eff.hidden;
      return customize || !eff.hidden ? meta : null;
    })
    .filter((meta): meta is DashboardWidgetMeta => meta !== null)
    .sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key));

  // Actions mirror widgets: RBAC by the TARGET role (customize) or the user (normal),
  // then per-role order/hidden overrides. Hidden actions stay in the customize payload (flagged).
  const actions = ACTIONS.filter(
    (action) => permitted === null || permitted.has(action.permission),
  )
    .map((action) => {
      const eff = effectiveAction(action, overrides);
      const { permission: _permission, sort: _sort, ...rest } = action;
      const dto: DashboardAction = { ...rest };
      if (customize) dto.hidden = eff.hidden;
      return { dto, sort: eff.sort, hidden: eff.hidden };
    })
    .filter((entry) => customize || !entry.hidden)
    .sort((a, b) => a.sort - b.sort || a.dto.key.localeCompare(b.dto.key))
    .map((entry) => entry.dto);

  return { widgets, actions };
}

export function getWidgetData(
  key: string,
  me: Me,
  ctx: WidgetContext,
  period: Period,
): WidgetData {
  const widget = WIDGETS.find((candidate) => candidate.key === key);
  if (!widget) throw new ApiError(404, "Unknown widget");
  // RBAC is server-side per widget (D:dashboard §9) — layout can't bypass it.
  if (!me.permissions.includes(widget.permission))
    throw new ApiError(403, "Forbidden");
  // period is already clamped by the route layer; non-period widgets ignore the arg.
  return widget.data(ctx, period);
}

export function saveDashboardLayout(
  me: Me,
  roleKey: string,
  body: LayoutOverrides,
): { ok: true } {
  requireManage(me);
  rolePermissions(roleKey); // 422 on unknown role

  const knownWidgets = new Set(WIDGETS.map((widget) => widget.key));
  const cleanWidgets: Record<string, WidgetLayoutOverride> = {};
  for (const [key, override] of Object.entries(body?.widgets ?? {})) {
    if (!knownWidgets.has(key)) continue; // unknown/disabled widget keys are ignored, not an error
    const entry: WidgetLayoutOverride = {};
    if (override.size !== undefined && SIZES.includes(override.size))
      entry.size = override.size;
    if (typeof override.sort === "number") entry.sort = override.sort;
    if (typeof override.hidden === "boolean") entry.hidden = override.hidden;
    cleanWidgets[key] = entry;
  }

  const knownActions = new Set(ACTIONS.map((action) => action.key));
  const cleanActions: Record<string, ActionLayoutOverride> = {};
  for (const [key, override] of Object.entries(body?.actions ?? {})) {
    if (!knownActions.has(key)) continue; // unknown/disabled action keys are ignored (no size for actions)
    const entry: ActionLayoutOverride = {};
    if (typeof override.sort === "number") entry.sort = override.sort;
    if (typeof override.hidden === "boolean") entry.hidden = override.hidden;
    cleanActions[key] = entry;
  }

  const all = layouts();
  all[roleKey] = { widgets: cleanWidgets, actions: cleanActions };
  persistLayouts(all);
  return { ok: true };
}

export function resetDashboardLayout(me: Me, roleKey: string): { ok: true } {
  requireManage(me);
  rolePermissions(roleKey);
  const all = layouts();
  delete all[roleKey];
  persistLayouts(all);
  return { ok: true };
}
