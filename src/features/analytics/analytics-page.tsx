import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartLine, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "recharts";

import {
  api,
  type AnalyticsKpi,
  type AnalyticsPayload,
  type Period,
} from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCompactMoney, formatMoney, formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * /analytics (build-demo-screen-catalog): a Recharts analytics dashboard. A
 * global period picker drives one payload (api.analytics.get) that feeds a KPI
 * stat-tile row, a revenue/sessions area chart, a channels bar chart, a
 * top-products list and a conversion funnel. Every chart color comes from the
 * --chart-* / status tokens; the grid collapses to one column on mobile.
 */

const PERIODS: Period[] = ["week", "month", "quarter"];

/** Format a KPI value in its natural unit (money / percentage / count). */
type KpiFormat = "money" | "percent" | "count";

interface KpiMeta {
  key: keyof AnalyticsPayload["kpis"];
  format: KpiFormat;
}

const KPIS: KpiMeta[] = [
  { key: "sessions", format: "count" },
  { key: "revenue", format: "money" },
  { key: "conversion", format: "percent" },
  { key: "aov", format: "money" },
];

export function AnalyticsPage() {
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>("month");

  console.debug("[AnalyticsPage] period", period);

  const query = useQuery({
    queryKey: ["analytics", period],
    queryFn: () => api.analytics.get(period),
    placeholderData: (previous) => previous,
  });

  const data = query.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.analytics")} icon={ChartLine} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("analytics.subtitle")}
        </p>
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value) => value && setPeriod(value as Period)}
          variant="outline"
          size="sm"
          aria-label={t("dashboard.period.label")}
        >
          {PERIODS.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(`dashboard.period.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {query.isPending ? (
        <AnalyticsSkeleton />
      ) : query.isError || !data ? (
        <Panel contentClassName="py-10">
          <EmptyState
            icon={ChartLine}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void query.refetch(),
            }}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {KPIS.map((meta) => (
              <KpiTile
                key={meta.key}
                label={t(`analytics.kpi.${meta.key}`)}
                kpi={data.kpis[meta.key]}
                format={meta.format}
                currency={data.currency}
              />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <RevenueChart data={data} />
            </div>
            <ChannelsChart data={data} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopProducts data={data} />
            <Funnel data={data} />
          </div>
        </>
      )}
    </div>
  );

  function KpiTile({
    label,
    kpi,
    format,
    currency,
  }: {
    label: string;
    kpi: AnalyticsKpi;
    format: KpiFormat;
    currency: string;
  }) {
    const value =
      format === "money"
        ? formatMoney(kpi.value, currency, locale)
        : format === "percent"
          ? `${(kpi.value * 100).toFixed(2)}%`
          : formatNumber(kpi.value, locale);
    return (
      <div className="glass-card rounded-2xl p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
        <DeltaPill delta={kpi.delta} />
      </div>
    );
  }
}

/** Semantic delta pill: green when up, destructive when down. */
function DeltaPill({ delta }: { delta: number }) {
  const Trend = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
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
        {(delta * 100).toFixed(1)}%
      </span>
      <span className="text-muted-foreground">
        {t("dashboard.delta_period")}
      </span>
    </p>
  );
}

function RevenueChart({ data }: { data: AnalyticsPayload }) {
  const locale = useLocale();
  const config = useMemo<ChartConfig>(
    () => ({
      revenue: { label: t("analytics.chart.revenue"), color: "var(--chart-1)" },
      sessions: {
        label: t("analytics.chart.sessions"),
        color: "var(--chart-2)",
      },
    }),
    [],
  );
  const empty = data.revenue_series.length === 0;
  return (
    <Panel
      icon={ChartLine}
      title={t("analytics.chart.revenue_title")}
      description={t("analytics.chart.revenue_hint")}
    >
      {empty ? (
        <EmptyState icon={ChartLine} title={t("analytics.empty")} />
      ) : (
        <ChartContainer
          config={config}
          ariaLabel={t("analytics.chart.revenue_title")}
          className="aspect-auto h-[260px] w-full"
        >
          <AreaChart
            data={data.revenue_series}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <defs>
              <linearGradient
                id="analytics-revenue"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id="analytics-sessions"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--color-sessions)"
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-sessions)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              minTickGap={24}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) =>
                    name === "revenue"
                      ? formatMoney(Number(value), data.currency, locale)
                      : formatNumber(Number(value), locale)
                  }
                />
              }
            />
            <Area
              dataKey="sessions"
              type="monotone"
              stroke="var(--color-sessions)"
              strokeWidth={2}
              fill="url(#analytics-sessions)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              fill="url(#analytics-revenue)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </Panel>
  );
}

function ChannelsChart({ data }: { data: AnalyticsPayload }) {
  const locale = useLocale();
  const rows = useMemo(
    () =>
      data.channels.map((channel) => ({
        ...channel,
        label: t(`analytics.channel.${channel.name}`),
      })),
    [data.channels],
  );
  const config = useMemo<ChartConfig>(
    () => ({
      value: { label: t("analytics.chart.revenue"), color: "var(--chart-1)" },
    }),
    [],
  );
  return (
    <Panel
      icon={ChartLine}
      title={t("analytics.channels_title")}
      description={t("analytics.channels_hint")}
    >
      {rows.length === 0 ? (
        <EmptyState icon={ChartLine} title={t("analytics.empty")} />
      ) : (
        <ChartContainer
          config={config}
          ariaLabel={t("analytics.channels_title")}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid
              horizontal={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    formatMoney(Number(value), data.currency, locale)
                  }
                />
              }
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
              {rows.map((_, index) => (
                <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </Panel>
  );
}

function TopProducts({ data }: { data: AnalyticsPayload }) {
  const locale = useLocale();
  const max = Math.max(1, ...data.top_products.map((product) => product.value));
  return (
    <Panel
      icon={ChartLine}
      title={t("analytics.top_products_title")}
      description={t("analytics.top_products_hint")}
    >
      {data.top_products.length === 0 ? (
        <EmptyState icon={ChartLine} title={t("analytics.empty")} />
      ) : (
        <ul className="space-y-3">
          {data.top_products.map((product) => (
            <li key={product.name}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-medium">
                  {product.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {formatCompactMoney(product.value, data.currency, locale)}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-500"
                  style={{
                    width: `${Math.round((product.value / max) * 100)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Funnel({ data }: { data: AnalyticsPayload }) {
  const locale = useLocale();
  const top = Math.max(1, data.funnel[0]?.value ?? 1);
  return (
    <Panel
      icon={ChartLine}
      title={t("analytics.funnel_title")}
      description={t("analytics.funnel_hint")}
    >
      {data.funnel.length === 0 ? (
        <EmptyState icon={ChartLine} title={t("analytics.empty")} />
      ) : (
        <ol className="space-y-2.5">
          {data.funnel.map((step, index) => {
            const pct = Math.round((step.value / top) * 100);
            return (
              <li key={step.key}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate">
                    {t(`analytics.funnel.${step.key}`)}
                  </span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatNumber(step.value, locale)} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-6 w-full overflow-hidden rounded-lg bg-muted">
                  <div
                    className="flex h-full items-center rounded-lg transition-[width] duration-500"
                    style={{
                      width: `${pct}%`,
                      background: `var(--chart-${(index % 5) + 1})`,
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}
