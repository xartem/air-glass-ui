import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Shared category/status donut (ecommerce categories, projects task status,
 * blog categories). Recharts Pie with an inner radius; one --chart-* token per
 * slice, plus a token legend beside the ring.
 */

export function Donut({
  data,
  ariaLabel,
  formatValue,
}: {
  data: ReadonlyArray<{ label: string; value: number }>;
  ariaLabel: string;
  formatValue?: (value: number) => string;
}) {
  const rows = data as Array<{ label: string; value: number }>;
  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        rows.map((row, index) => [
          row.label,
          { label: row.label, color: `var(--chart-${(index % 5) + 1})` },
        ]),
      ),
    [rows],
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <ChartContainer
        config={config}
        ariaLabel={ariaLabel}
        className="aspect-square h-[180px]"
      >
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) =>
                  formatValue ? formatValue(Number(value)) : String(value)
                }
              />
            }
          />
          <Pie
            data={rows}
            dataKey="value"
            nameKey="label"
            innerRadius={52}
            outerRadius={80}
            paddingAngle={2}
            strokeWidth={0}
          >
            {rows.map((_, index) => (
              <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {rows.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: `var(--chart-${(index % 5) + 1})` }}
            />
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatValue ? formatValue(row.value) : row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
