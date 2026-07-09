import { useId } from "react";
import { Area, AreaChart } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

/*
 * Tiny axis-less sparkline for per-coin rows (crypto). Single --chart-* stroke
 * with a soft gradient fill; no axes, grid or tooltip — just the shape.
 */

const CONFIG: ChartConfig = { value: { label: "", color: "var(--chart-1)" } };

export function Sparkline({
  data,
  color = "var(--chart-1)",
  ariaLabel,
  className = "h-9 w-24",
}: {
  data: readonly number[];
  color?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const points = data.map((value, label) => ({ label, value }));
  return (
    <ChartContainer
      config={CONFIG}
      ariaLabel={ariaLabel}
      className={`aspect-auto ${className}`}
    >
      <AreaChart
        data={points}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <defs>
          <linearGradient id={`spark-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          dataKey="value"
          type="monotone"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${uid})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
