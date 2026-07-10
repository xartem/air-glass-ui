import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Shared category bar chart (ecommerce sources, jobs departments, crm pipeline,
 * nft volume). Horizontal = ranked rows (vertical Recharts layout); vertical =
 * columns over a period bucket. Bar colors cycle the --chart-* tokens.
 */

export function CategoryBars({
  data,
  ariaLabel,
  formatValue,
  orientation = "horizontal",
  multiColor = true,
  height = 260,
}: {
  data: ReadonlyArray<{ label: string; value: number }>;
  ariaLabel: string;
  formatValue?: (value: number) => string;
  orientation?: "horizontal" | "vertical";
  multiColor?: boolean;
  height?: number;
}) {
  const config = useMemo<ChartConfig>(
    () => ({ value: { label: ariaLabel, color: "var(--chart-1)" } }),
    [ariaLabel],
  );
  const rows = data as Array<{ label: string; value: number }>;
  const cells = rows.map((_, index) => (
    <Cell
      key={index}
      fill={multiColor ? `var(--chart-${(index % 5) + 1})` : "var(--chart-1)"}
    />
  ));

  return (
    <ChartContainer
      config={config}
      ariaLabel={ariaLabel}
      className="aspect-auto w-full"
      style={{ height }}
    >
      {orientation === "horizontal" ? (
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
            width={84}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatValue ? formatValue(Number(value)) : String(value)
                }
              />
            }
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
            {cells}
          </Bar>
        </BarChart>
      ) : (
        <BarChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
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
            minTickGap={16}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis hide />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatValue ? formatValue(Number(value)) : String(value)
                }
              />
            }
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {cells}
          </Bar>
        </BarChart>
      )}
    </ChartContainer>
  );
}
