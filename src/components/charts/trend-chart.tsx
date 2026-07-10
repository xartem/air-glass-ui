import { useId, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Shared area/line trend used across the dashboard verticals (ecommerce revenue,
 * projects burndown, jobs applications, blog views). One or more series over a
 * period bucket; colors come only from the passed --chart-* tokens.
 */

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

export function TrendChart({
  data,
  seriesList,
  variant = "area",
  ariaLabel,
  formatValue,
  height = 260,
}: {
  data: readonly object[];
  seriesList: TrendSeries[];
  variant?: "area" | "line";
  ariaLabel: string;
  formatValue?: (value: number, key: string) => string;
  height?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        seriesList.map((s) => [s.key, { label: s.label, color: s.color }]),
      ),
    [seriesList],
  );

  const Chart = variant === "line" ? LineChart : AreaChart;

  return (
    <ChartContainer
      config={config}
      ariaLabel={ariaLabel}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <Chart
        data={data as never}
        margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
      >
        {variant === "area" ? (
          <defs>
            {seriesList.map((s) => (
              <linearGradient
                key={s.key}
                id={`trend-${uid}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={`var(--color-${s.key})`}
                  stopOpacity={0.25}
                />
                <stop
                  offset="100%"
                  stopColor={`var(--color-${s.key})`}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
        ) : null}
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
                formatValue
                  ? formatValue(Number(value), String(name))
                  : String(value)
              }
            />
          }
        />
        {seriesList.map((s) =>
          variant === "line" ? (
            <Line
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ) : (
            <Area
              key={s.key}
              dataKey={s.key}
              type="monotone"
              stroke={`var(--color-${s.key})`}
              strokeWidth={2}
              fill={`url(#trend-${uid}-${s.key})`}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          ),
        )}
      </Chart>
    </ChartContainer>
  );
}
