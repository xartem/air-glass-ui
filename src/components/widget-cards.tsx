import {
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CircleCheck,
  CircleX,
  Inbox,
  Star,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
} from "recharts";

import type {
  ChartData,
  ListData,
  ListItem,
  StatData,
  StatusData,
  StatusRow,
  WidgetSize,
} from "@/api";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { dashboardIcon } from "@/lib/dashboard-icons";
import {
  MASONRY_GAP,
  MASONRY_ROW,
  MasonryContext,
} from "@/components/widget-grid";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Widget archetypes (E6, D:dashboard §4): StatCard / ChartCard / ListCard /
 * StatusCard are the ONLY four renderers of dashboard widget data — modules
 * pick a type + data shape, never draw their own markup. Size is a CONTENT
 * TIER: sm = glance, md = base archetype, lg = expanded form.
 * All charts/sparklines are Recharts (E2 §2) — no hand-rolled SVG.
 */

/* ---- shared card frame ---- */

export function WidgetCardFrame({
  title,
  href,
  icon,
  children,
  className,
}: {
  title: string;
  /** Widget route (D:dashboard §4): the title links here when set. */
  href?: string | null;
  /** Lucide slug from widget meta; unknown/absent → header renders without a chip. */
  icon?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const Icon = dashboardIcon(icon);
  const masonry = useContext(MasonryContext);
  const ref = useRef<HTMLDivElement>(null);
  const [rowSpan, setRowSpan] = useState<number>();

  // Masonry (D:dashboard §4): measure the content-height card and reserve that many
  // row tracks (+ one inter-card gap) so uneven cards pack without stretching.
  useLayoutEffect(() => {
    if (!masonry) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      const span = Math.max(1, Math.ceil((height + MASONRY_GAP) / MASONRY_ROW));
      setRowSpan((prev) => (prev === span ? prev : span));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [masonry]);

  return (
    <Card
      ref={ref}
      data-slot="widget"
      size="sm"
      // self-start keeps the card content-height so its own row span never feeds back into the measurement.
      className={cn(
        "transition-shadow duration-200 hover:ring-foreground/20",
        masonry ? "self-start" : "h-full",
        className,
      )}
      style={masonry && rowSpan ? { gridRowEnd: `span ${rowSpan}` } : undefined}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {Icon ? (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
          ) : null}
          {href ? (
            <Link
              to={href}
              className="group/widget-title inline-flex min-w-0 items-center gap-1 hover:text-foreground"
            >
              <span className="truncate">{title}</span>
              <ArrowUpRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/widget-title:opacity-100" />
            </Link>
          ) : (
            <span className="truncate">{title}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  );
}

/* ---- helpers ---- */

/** Ease-out count-up for stat values; respects prefers-reduced-motion. */
function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

function CountUpValue({ value }: { value: number }) {
  const display = useCountUp(value);
  return <>{display}</>;
}

/*
 * Compact tooltip dedicated to the sparkline: width hugs its content (date on
 * top, value below). The shared ChartTooltipContent carries min-w-32 + a
 * justify-between row that make sense for multi-series charts but leave a wide
 * empty box around a single sparkline value — so this one is bespoke and does
 * NOT touch the shared chart.tsx (still used by ChartCard).
 */
function SparklineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: { label?: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const label = point.payload?.label;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-2 py-1 text-xs shadow-xl">
      {label ? <div className="text-muted-foreground">{label}</div> : null}
      <div className="font-medium tabular-nums">{point.value}</div>
    </div>
  );
}

/** Inline Recharts sparkline: blue→mint gradient stroke over a soft area fade.
 * `labels` (stat.series_labels) align to points for a meaningful hover tooltip. */
function Sparkline({
  points,
  labels,
  height = 28,
  fullWidth = false,
}: {
  points: number[];
  labels?: string[];
  height?: number;
  /** Fill the row (sm/xl stat "number + mini-chart") instead of the fixed 96px corner sparkline. */
  fullWidth?: boolean;
}) {
  const strokeId = useId();
  const fillId = useId();
  const data = useMemo(
    () => points.map((y, index) => ({ index, y, label: labels?.[index] })),
    [points, labels],
  );
  if (points.length < 2) return null;
  return (
    <ChartContainer
      config={{ y: { label: "", color: "var(--chart-1)" } }}
      // Decorative trend line: the headline number/delta it accompanies is already
      // rendered as text, so hide the (otherwise unlabeled) SVG from assistive tech
      // instead of exposing empty chart groups (WCAG 1.1.1).
      aria-hidden="true"
      // fullWidth bleeds edge-to-edge: negative inline margin cancels the card's
      // horizontal padding so the sparkline spans the whole widget (card is
      // overflow-hidden → clipped to its rounded corners, no page overflow).
      className={cn(
        "aspect-auto",
        fullWidth
          ? "-mx-[var(--card-spacing)] w-[calc(100%_+_2*var(--card-spacing))]"
          : "w-24 shrink-0",
      )}
      style={{ height }}
      initialDimension={{ width: fullWidth ? 320 : 96, height }}
    >
      <AreaChart data={data} margin={{ top: 3, right: 0, bottom: 3, left: 0 }}>
        <defs>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" />
            <stop offset="100%" stopColor="var(--chart-2)" />
          </linearGradient>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
            <stop offset="55%" stopColor="var(--chart-1)" stopOpacity={0.15} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {labels ? (
          <ChartTooltip cursor={false} content={<SparklineTooltip />} />
        ) : null}
        <Area
          dataKey="y"
          type="monotone"
          stroke={`url(#${strokeId})`}
          strokeWidth={2}
          fill={`url(#${fillId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** "from → to" comparison baseline under a stat number (stat.compare). */
function StatCompare({
  compare,
}: {
  compare: NonNullable<StatData["compare"]>;
}) {
  const unit = compare.unit ?? "";
  return (
    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
      {compare.from}
      {unit}{" "}
      <ArrowRight className="inline size-3 align-[-1px] rtl:-scale-x-100" />{" "}
      {compare.to}
      {unit}
    </p>
  );
}

/** Thin progress toward a target (stat.goal); `value` is the current numeric value. */
function StatGoal({
  value,
  goal,
}: {
  value: number;
  goal: NonNullable<StatData["goal"]>;
}) {
  const pct =
    goal.target > 0
      ? Math.min(100, Math.round((value / goal.target) * 100))
      : 0;
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        {goal.label_key ? `${t(goal.label_key)} ` : ""}
        {pct}% · {value}/{goal.target}
      </p>
    </div>
  );
}

/** Semantic delta pill: the module encodes "what is good" via the sign (UI:dashboard §2). */
function DeltaPill({ delta }: { delta: number }) {
  const Trend = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        delta < 0 && "bg-destructive/10 text-destructive",
      )}
      style={
        delta >= 0
          ? {
              background: "var(--status-success-bg)",
              color: "var(--status-success-fg)",
            }
          : undefined
      }
    >
      <Trend className="size-3" />
      {delta >= 0 ? "+" : ""}
      {delta}%
    </span>
  );
}

function StatDelta({ delta }: { delta: number }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs">
      <DeltaPill delta={delta} />
      <span className="text-muted-foreground">
        {t("dashboard.delta_period")}
      </span>
    </p>
  );
}

/* ---- stat ---- */

export function StatCard({
  title,
  href,
  icon,
  size,
  data,
  className,
}: {
  title: string;
  href?: string | null;
  icon?: string | null;
  size: WidgetSize;
  data: StatData;
  className?: string;
}) {
  const value =
    typeof data.value === "number" ? (
      <CountUpValue value={data.value} />
    ) : (
      data.value
    );
  const expanded = size === "lg" || size === "xl";
  // goal needs a numeric current value to compute progress.
  const numericValue = typeof data.value === "number" ? data.value : undefined;
  const extras = (
    <>
      {data.delta !== undefined ? <StatDelta delta={data.delta} /> : null}
      {data.compare ? <StatCompare compare={data.compare} /> : null}
      {data.goal && numericValue !== undefined ? (
        <StatGoal value={numericValue} goal={data.goal} />
      ) : null}
    </>
  );

  // Glance tier: big number + extras + a full-width sparkline that fills the card (no empty bottom).
  if (size === "sm") {
    return (
      <WidgetCardFrame
        title={title}
        href={href}
        icon={icon}
        className={className}
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {extras}
          {data.series ? (
            <Sparkline
              points={data.series}
              labels={data.series_labels}
              height={40}
              fullWidth
            />
          ) : null}
        </div>
      </WidgetCardFrame>
    );
  }

  // xl "alternate form" (D:dashboard §4): number + a full-width mini-chart. No series → inherit lg below.
  if (size === "xl" && data.series) {
    return (
      <WidgetCardFrame
        title={title}
        href={href}
        icon={icon}
        className={className}
      >
        <div className="flex flex-col gap-2">
          <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          {extras}
          <Sparkline
            points={data.series}
            labels={data.series_labels}
            height={120}
            fullWidth
          />
        </div>
      </WidgetCardFrame>
    );
  }

  // md / lg (and xl without series → inherits this): number + corner sparkline + extras.
  return (
    <WidgetCardFrame
      title={title}
      href={href}
      icon={icon}
      className={className}
    >
      <div className="flex flex-col">
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              "font-semibold tracking-tight tabular-nums",
              expanded ? "text-5xl leading-none" : "text-4xl leading-none",
            )}
          >
            {value}
          </p>
          {data.series ? (
            <Sparkline
              points={data.series}
              labels={data.series_labels}
              height={expanded ? 44 : 32}
            />
          ) : null}
        </div>
        {extras}
      </div>
    </WidgetCardFrame>
  );
}

/* ---- chart ---- */

/** Shared with the widget skeletons (rigid skeleton contract, E4/E6). */
export const CHART_HEIGHT: Record<WidgetSize, number> = {
  sm: 64,
  md: 180,
  lg: 220,
  xl: 260,
};

export function ChartCard({
  title,
  href,
  icon,
  size,
  data,
  className,
}: {
  title: string;
  href?: string | null;
  icon?: string | null;
  size: WidgetSize;
  data: ChartData;
  className?: string;
}) {
  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        data.series.map((entry, index) => [
          `s${index}`,
          {
            label: t(entry.label_key),
            color: `var(--chart-${(index % 5) + 1})`,
          },
        ]),
      ),
    [data.series],
  );

  // Merge per-series point lists into one row per x for Recharts.
  const rows = useMemo(() => {
    const byX = new Map<string, Record<string, string | number>>();
    data.series.forEach((entry, index) => {
      for (const point of entry.points) {
        const row = byX.get(point.x) ?? { x: point.x };
        row[`s${index}`] = point.y;
        byX.set(point.x, row);
      }
    });
    return [...byX.values()];
  }, [data.series]);

  const glance = size === "sm";
  const seriesMeta = data.series.map((entry, index) => ({
    key: `s${index}`,
    dashed: entry.dashed ?? false,
  }));
  const seriesKeys = seriesMeta.map((entry) => entry.key);
  const dashedKeys = new Set(
    seriesMeta.filter((entry) => entry.dashed).map((entry) => entry.key),
  );
  const gradientBase = useId();

  const referenceLine =
    data.reference && !glance ? (
      <ReferenceLine
        y={data.reference.y}
        stroke="var(--muted-foreground)"
        strokeDasharray="4 4"
        strokeOpacity={0.7}
        label={
          data.reference.label_key
            ? {
                value: t(data.reference.label_key),
                position: "insideTopRight",
                fontSize: 10,
                fill: "var(--muted-foreground)",
              }
            : undefined
        }
      />
    ) : null;

  const grid = !glance ? (
    <CartesianGrid
      vertical={false}
      strokeDasharray="3 3"
      stroke="var(--border)"
      strokeOpacity={0.6}
    />
  ) : null;
  const xAxis = !glance ? (
    <XAxis
      dataKey="x"
      tickLine={false}
      axisLine={false}
      tickMargin={6}
      minTickGap={16}
      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
    />
  ) : null;

  return (
    <WidgetCardFrame
      title={title}
      href={href}
      icon={icon}
      className={className}
    >
      {data.summary && !glance ? (
        // Headline number above the chart (chart.summary) — the period total at a glance.
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {data.summary.total}
          </span>
          {data.summary.delta !== undefined ? (
            <DeltaPill delta={data.summary.delta} />
          ) : null}
        </div>
      ) : null}
      <ChartContainer
        config={config}
        role="img"
        aria-label={
          data.summary?.total ? `${title} — ${data.summary.total}` : title
        }
        className="aspect-auto w-full"
        style={{ height: CHART_HEIGHT[size] }}
      >
        {data.kind === "bar" ? (
          <BarChart
            data={rows}
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              {seriesKeys.map((key) => (
                <linearGradient
                  key={key}
                  id={`${gradientBase}-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.95}
                  />
                  <stop
                    offset="100%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.55}
                  />
                </linearGradient>
              ))}
            </defs>
            {grid}
            {xAxis}
            {referenceLine}
            <ChartTooltip content={<ChartTooltipContent />} />
            {size === "xl" && seriesKeys.length > 1 ? (
              <ChartLegend content={<ChartLegendContent />} />
            ) : null}
            {/* Top-only rounding: tiny values stay bars, not dots. Dashed = previous period → hollow. */}
            {seriesKeys.map((key) =>
              dashedKeys.has(key) ? (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  fillOpacity={0.25}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ) : (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`url(#${gradientBase}-${key})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              ),
            )}
          </BarChart>
        ) : (
          <AreaChart
            data={rows}
            margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
          >
            <defs>
              {seriesKeys.map((key) => (
                <linearGradient
                  key={key}
                  id={`${gradientBase}-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="100%"
                    stopColor={`var(--color-${key})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            {grid}
            {xAxis}
            {referenceLine}
            <ChartTooltip content={<ChartTooltipContent />} />
            {size === "xl" && seriesKeys.length > 1 ? (
              <ChartLegend content={<ChartLegendContent />} />
            ) : null}
            {seriesKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                // Dashed series = previous period (chart.series[].dashed): muted stroke, no fill.
                strokeDasharray={dashedKeys.has(key) ? "4 3" : undefined}
                strokeOpacity={dashedKeys.has(key) ? 0.6 : 1}
                fill={
                  dashedKeys.has(key)
                    ? "transparent"
                    : `url(#${gradientBase}-${key})`
                }
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        )}
      </ChartContainer>
    </WidgetCardFrame>
  );
}

/* ---- list ---- */

/** Shared with the widget skeletons (rigid skeleton contract, E4/E6). */
export const LIST_ROWS: Record<WidgetSize, number> = {
  sm: 2,
  md: 6,
  lg: 8,
  xl: 10,
};

/** Known cross-module badge tokens → i18n; unknown tokens (e.g. "0") render raw. */
const BADGE_I18N: Record<string, string> = {
  new: "status.badge.new",
  paid: "status.badge.paid",
  shipped: "status.badge.shipped",
  done: "status.badge.done",
  scheduled: "status.badge.scheduled",
  draft: "status.badge.draft",
};

function badgeLabel(token: string): string {
  const key = BADGE_I18N[token];
  return key ? t(key) : token;
}

/** Leading visual for a list row (D:dashboard §4): thumb → avatar → leadIcon, mutually exclusive. */
function RowLead({ item, compact }: { item: ListItem; compact: boolean }) {
  const size = compact ? "size-6" : "size-8";
  if (item.thumb) {
    return (
      <img
        src={item.thumb}
        alt=""
        className={cn(size, "shrink-0 rounded-md object-cover")}
        loading="lazy"
      />
    );
  }
  if (item.avatar) {
    return (
      <span
        className={cn(
          size,
          "flex shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-medium text-muted-foreground",
        )}
      >
        {item.avatar}
      </span>
    );
  }
  const Icon = dashboardIcon(item.leadIcon);
  if (Icon) {
    return (
      <span
        className={cn(
          size,
          "flex shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
        )}
      >
        <Icon className={compact ? "size-3.5" : "size-4"} />
      </span>
    );
  }
  return null;
}

/** Right-aligned metric (list.item.metric): value + optional delta pill INLINE,
 * so rows with and without a delta keep the same height (single line). */
function RowMetric({ metric }: { metric: NonNullable<ListItem["metric"]> }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <span className="text-sm font-semibold tabular-nums">{metric.value}</span>
      {metric.delta !== undefined ? (
        <span
          className={cn(
            "rounded px-1 py-0.5 text-[11px] font-medium tabular-nums",
            metric.delta < 0 && "bg-destructive/10 text-destructive",
          )}
          style={
            metric.delta >= 0
              ? {
                  background: "var(--status-success-bg)",
                  color: "var(--status-success-fg)",
                }
              : undefined
          }
        >
          {metric.delta >= 0 ? "+" : ""}
          {metric.delta}%
        </span>
      ) : null}
    </span>
  );
}

/** Star rating (list.item.rating) — a site-style amber star + the number. */
function RowRating({ rating }: { rating: number }) {
  return (
    <span
      className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums"
      style={{ color: "var(--status-pending-fg)" }}
    >
      <Star className="size-3.5 fill-current" />
      {rating.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })}
    </span>
  );
}

function ListRow({
  item,
  rich,
}: {
  item: ListData["items"][number];
  rich: boolean;
}) {
  const hasLead = Boolean(item.thumb || item.avatar || item.leadIcon);
  // Single line: title fills, hint sits right (muted), then rating/metric/badge —
  // so a wide row (e.g. auth.activity) uses its full width and the hint (subject/
  // meta) always shows, even alongside a metric (D:dashboard §4 list row).
  const body = (
    <>
      {hasLead ? <RowLead item={item} compact={!rich} /> : null}
      <span className="min-w-0 flex-1 truncate font-medium">{item.title}</span>
      {item.hint ? (
        <span className="min-w-0 shrink truncate text-xs text-muted-foreground">
          {item.hint}
        </span>
      ) : null}
      {item.rating !== undefined ? <RowRating rating={item.rating} /> : null}
      {item.metric ? <RowMetric metric={item.metric} /> : null}
      {item.badge ? (
        // "new" is the cross-module freshness convention (UI:dashboard §3) — accent it.
        <Badge
          variant="secondary"
          className={cn(item.badge === "new" && "bg-primary/10 text-primary")}
        >
          {badgeLabel(item.badge)}
        </Badge>
      ) : null}
    </>
  );
  if (item.url) {
    return (
      <li>
        <Link
          to={item.url}
          className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent/40"
        >
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li className={cn("flex items-center gap-2 text-sm", rich && "py-1.5")}>
      {body}
    </li>
  );
}

/** Compact centered empty for tiny widget bodies (full EmptyState is too heavy here). */
function WidgetEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
      <Inbox className="size-5 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">
        {t("dashboard.widget_empty")}
      </p>
    </div>
  );
}

export function ListCard({
  title,
  href,
  icon,
  size,
  data,
  className,
}: {
  title: string;
  href?: string | null;
  icon?: string | null;
  size: WidgetSize;
  data: ListData;
  className?: string;
}) {
  const items = data.items.slice(0, LIST_ROWS[size]);
  const expanded = size === "lg" || size === "xl";
  // xl "alternate form" (D:dashboard §4): a two-column grid uses the full width; too
  // few items would look sparse in two columns → inherit the lg single column.
  const twoCol = size === "xl" && data.items.length > 4;
  const viewAll = href ? (
    <Link
      to={href}
      className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
    >
      {t("dashboard.widget.view_all")}
      <ArrowRight className="size-3.5 rtl:-scale-x-100" />
    </Link>
  ) : null;
  return (
    <WidgetCardFrame
      title={title}
      href={href}
      icon={icon}
      className={className}
    >
      {data.items.length === 0 ? (
        <WidgetEmpty />
      ) : size === "sm" ? (
        // Glance tier: BIG total count, top rows pinned below.
        <div className="flex flex-col">
          <p className="text-5xl leading-none font-semibold tracking-tight tabular-nums">
            <CountUpValue value={data.items.length} />
          </p>
          <ul className="mt-2">
            {items.map((item, index) => (
              <ListRow key={index} item={item} rich={false} />
            ))}
          </ul>
        </div>
      ) : twoCol ? (
        <>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5">
            {items.map((item, index) => (
              <ListRow key={index} item={item} rich />
            ))}
          </ul>
          {viewAll}
        </>
      ) : (
        <>
          <ul className="space-y-0.5">
            {items.map((item, index) => (
              <ListRow key={index} item={item} rich={expanded} />
            ))}
          </ul>
          {expanded ? viewAll : null}
        </>
      )}
    </WidgetCardFrame>
  );
}

/* ---- status ---- */

const STATE_TO_STATUS: Record<StatusRow["state"], StatusKind> = {
  ok: "success",
  warn: "pending",
  error: "error",
};

/** Small tinted state marker in front of the row label (colors = StatusBadge tokens). */
function StateIcon({ state }: { state: StatusRow["state"] }) {
  if (state === "error")
    return <CircleX className="size-4 shrink-0 text-destructive" />;
  if (state === "warn")
    return (
      <TriangleAlert
        className="size-4 shrink-0"
        style={{ color: "var(--status-pending-fg)" }}
      />
    );
  return (
    <CircleCheck
      className="size-4 shrink-0"
      style={{ color: "var(--status-success-fg)" }}
    />
  );
}

/** Signed mini-trend next to a status value (status.row.trend). */
function StatusTrend({ trend }: { trend: number }) {
  const Trend = trend >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-0.5 text-xs font-medium tabular-nums",
        trend < 0 ? "text-destructive" : "text-muted-foreground",
      )}
    >
      <Trend className="size-3" />
      {trend >= 0 ? "+" : ""}
      {trend}%
    </span>
  );
}

/** One status row; becomes a link when the module supplies `url` (status.row.url). */
function StatusRowItem({ row, size }: { row: StatusRow; size: WidgetSize }) {
  const inner = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <StateIcon state={row.state} />
        <span
          className={cn(
            "truncate",
            size === "sm"
              ? "text-base text-foreground"
              : "text-muted-foreground",
          )}
        >
          {t(row.label_key)}
        </span>
      </span>
      {row.trend !== undefined ? <StatusTrend trend={row.trend} /> : null}
      {/* min-w-0 lets a long value truncate instead of squeezing the label to nothing. */}
      <StatusBadge
        status={STATE_TO_STATUS[row.state]}
        label={row.value}
        className="min-w-0 max-w-[50%]"
      />
    </>
  );
  if (row.url) {
    return (
      <li>
        <Link
          to={row.url}
          className="-mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-accent/40"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li className="flex items-center justify-between gap-2 text-sm">{inner}</li>
  );
}

/** xl "alternate form" (D:dashboard §4): rows as an aligned table — label · value · trend. */
function StatusTable({ rows }: { rows: StatusRow[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((row) => {
          const label = (
            <span className="flex items-center gap-2">
              <StateIcon state={row.state} />
              <span className="truncate">{t(row.label_key)}</span>
            </span>
          );
          return (
            <tr
              key={row.label_key}
              className="border-t border-border/60 first:border-0"
            >
              <td className="py-2 pe-3">
                {row.url ? (
                  <Link to={row.url} className="hover:underline">
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </td>
              <td className="py-2 text-end">
                <StatusBadge
                  status={STATE_TO_STATUS[row.state]}
                  label={row.value}
                />
              </td>
              <td className="w-16 py-2 ps-3 text-end">
                {row.trend !== undefined ? (
                  <span className="inline-flex justify-end">
                    <StatusTrend trend={row.trend} />
                  </span>
                ) : null}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function StatusCard({
  title,
  href,
  icon,
  size,
  data,
  className,
}: {
  title: string;
  href?: string | null;
  icon?: string | null;
  size: WidgetSize;
  data: StatusData;
  className?: string;
}) {
  // All rows at every tier now (a compact glance is fine under masonry). xl gets
  // the table form; too few rows → inherit the row list (D:dashboard §4 inherit-down).
  const rows = data.rows;
  const asTable = size === "xl" && rows.length >= 3;
  return (
    <WidgetCardFrame
      title={title}
      href={href}
      icon={icon}
      className={className}
    >
      {rows.length === 0 ? (
        <WidgetEmpty />
      ) : asTable ? (
        <StatusTable rows={rows} />
      ) : (
        <ul
          className={cn(
            size === "lg" || size === "xl" ? "space-y-2.5" : "space-y-1.5",
          )}
        >
          {rows.map((row) => (
            <StatusRowItem key={row.label_key} row={row} size={size} />
          ))}
        </ul>
      )}
    </WidgetCardFrame>
  );
}
