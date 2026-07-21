import { TrendingDown, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkline } from "@/components/charts/sparkline";
import type { DashKpi, LeaderRow, RankedRow } from "@/api";
import type { AdminLocale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { formatCompactMoney, formatMoney, formatNumber } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * Reusable dashboard widgets shared by the 7 verticals: KPI stat tile + delta
 * pill, ranked bar list and people leaderboard. Token-only styling; money via
 * src/lib/money.ts, numbers locale-aware via useLocale.
 */

export type MetricFormat = "money" | "compactMoney" | "percent" | "count";

/** Format a numeric metric in its natural unit; `unit` appends a suffix (e.g. "ETH", "d"). */
export function formatMetric(
  value: number,
  format: MetricFormat,
  locale: AdminLocale,
  currency = "USD",
  unit?: string,
): string {
  switch (format) {
    case "money":
      return formatMoney(value, currency, locale);
    case "compactMoney":
      return formatCompactMoney(value, currency, locale);
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "count":
    default:
      return unit
        ? `${formatNumber(value, locale)} ${unit}`
        : formatNumber(value, locale);
  }
}

/** Semantic delta pill: green when favourable, destructive when not. `invert` flips it (lower is better). */
export function DeltaPill({
  delta,
  invert = false,
}: {
  delta: number;
  invert?: boolean;
}) {
  const favourable = invert ? delta <= 0 : delta >= 0;
  const Trend = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
          !favourable && "bg-destructive/10 text-destructive",
        )}
        style={
          favourable
            ? {
                background: "var(--status-success-bg)",
                color: "var(--status-success-fg)",
              }
            : undefined
        }
      >
        <Trend className="size-3" />
        {delta >= 0 ? "+" : ""}
        {(delta * 100).toFixed(1)}%
      </span>
      <span className="text-muted-foreground">
        {t("dashboard.delta_period")}
      </span>
    </p>
  );
}

export function KpiTile({
  label,
  kpi,
  format,
  currency,
  unit,
  invertDelta = false,
}: {
  label: string;
  kpi: DashKpi;
  format: MetricFormat;
  currency?: string;
  unit?: string;
  invertDelta?: boolean;
}) {
  const locale = useLocale();
  const favourable = invertDelta ? kpi.delta <= 0 : kpi.delta >= 0;
  const sparkColor = favourable
    ? "var(--status-success-fg)"
    : "var(--status-error-fg)";
  return (
    <div className="glass-card flex flex-col rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {formatMetric(kpi.value, format, locale, currency, unit)}
      </div>
      <DeltaPill delta={kpi.delta} invert={invertDelta} />
      {kpi.spark && kpi.spark.length > 1 ? (
        <Sparkline
          data={kpi.spark}
          color={sparkColor}
          ariaLabel={label}
          className="mt-3 h-8 w-full"
        />
      ) : null}
    </div>
  );
}

/** Ranked rows: label + magnitude bar + formatted value; optional leading monogram thumb. */
export function RankedList({
  rows,
  format,
  currency,
  unit,
  className,
  withThumb = false,
}: {
  rows: RankedRow[];
  format: MetricFormat;
  currency?: string;
  unit?: string;
  className?: string;
  /** Prefix each row with a token monogram derived from its label (product/asset lists). */
  withThumb?: boolean;
}) {
  const locale = useLocale();
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <ul className={cn("space-y-3", className)}>
      {rows.map((row) => {
        const body = (
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">{row.label}</span>
              <span className="shrink-0 tabular-nums">
                {formatMetric(row.value, format, locale, currency, unit)}
              </span>
            </div>
            {row.hint ? (
              <div className="text-xs text-muted-foreground">{row.hint}</div>
            ) : null}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${Math.round((row.value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
        return (
          <li key={row.label} className="flex items-center gap-3">
            {withThumb ? <MonogramThumb seed={row.label} size="sm" /> : null}
            {body}
          </li>
        );
      })}
    </ul>
  );
}

/** Initials fallback for avatarless people. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Stable 32-bit hash of a seed string, so a given name always maps to the same tint. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Token-only thumbnail placeholder for asset-less list rows (products, posts,
 * collections). A deterministic diagonal tint mixed from two --chart-* tokens
 * with the initials on top — no external images (Envato-safe), contrast-safe in
 * light/dark/flat because the tint stays light over --card.
 */
export function MonogramThumb({
  seed,
  label,
  size = "md",
}: {
  seed: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const hash = hashSeed(seed);
  const first = (hash % 5) + 1;
  const second = (((Math.floor(hash / 5) % 5) + first) % 5) + 1;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold text-foreground ring-1 ring-[var(--glass-border)]",
        size === "sm" ? "size-8 text-[10px]" : "size-10 text-xs",
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, color-mix(in oklab, var(--chart-${first}) 32%, var(--card)), color-mix(in oklab, var(--chart-${second}) 32%, var(--card)))`,
      }}
    >
      {initials(label ?? seed)}
    </span>
  );
}

/** People leaderboard: avatar + name + headline metric + optional quota bar. */
export function Leaderboard({
  rows,
  format,
  currency,
  unit,
}: {
  rows: LeaderRow[];
  format: MetricFormat;
  currency?: string;
  unit?: string;
}) {
  const locale = useLocale();
  return (
    <ul className="space-y-4">
      {rows.map((row) => {
        const pct = row.quota
          ? Math.min(100, Math.round((row.metric / row.quota) * 100))
          : null;
        return (
          <li key={row.name} className="flex items-center gap-3">
            <Avatar size="sm">
              {row.avatar ? <AvatarImage src={row.avatar} alt="" /> : null}
              <AvatarFallback>{initials(row.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">{row.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatMetric(row.metric, format, locale, currency, unit)}
                </span>
              </div>
              {pct !== null ? (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
