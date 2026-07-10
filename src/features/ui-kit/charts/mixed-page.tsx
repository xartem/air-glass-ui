import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Mixed chart showcase (W5): Recharts ComposedChart combining columns with a
 * line, and columns with a trend area. Bars, line and area each resolve their
 * colour from a --chart-* token.
 */

const DATA = [
  { label: "Jan", revenue: 12400, conversion: 3.1 },
  { label: "Feb", revenue: 15200, conversion: 3.6 },
  { label: "Mar", revenue: 14100, conversion: 3.3 },
  { label: "Apr", revenue: 18700, conversion: 4.2 },
  { label: "May", revenue: 21300, conversion: 4.8 },
  { label: "Jun", revenue: 19800, conversion: 4.5 },
];

const BAR_LINE_CONFIG: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  conversion: { label: "Conversion %", color: "var(--chart-3)" },
};

const BAR_AREA_CONFIG: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
  trend: { label: "Trend", color: "var(--chart-2)" },
};

export function ChartsMixedPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.mixed.title")}
      description={t("showcase.charts.mixed.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.mixed.barLine")}
        previewClassName="block"
        code={`<ComposedChart data={data}>
  <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
  <Line yAxisId="right" dataKey="conversion" stroke="var(--color-conversion)" strokeWidth={2} />
</ComposedChart>`}
      >
        <ChartContainer
          config={BAR_LINE_CONFIG}
          ariaLabel={t("showcase.charts.mixed.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <ComposedChart
            data={DATA}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
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
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis yAxisId="left" hide />
            <YAxis yAxisId="right" orientation="right" hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              yAxisId="right"
              dataKey="conversion"
              type="monotone"
              stroke="var(--color-conversion)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.mixed.barArea")}
        previewClassName="block"
        code={`<ComposedChart data={data}>
  <Area dataKey="trend" stroke="var(--color-trend)" fill="var(--color-trend)" />
  <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
</ComposedChart>`}
      >
        <ChartContainer
          config={BAR_AREA_CONFIG}
          ariaLabel={t("showcase.charts.mixed.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <ComposedChart
            data={DATA.map((row) => ({ ...row, trend: row.revenue * 0.9 }))}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
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
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="trend"
              type="monotone"
              stroke="var(--color-trend)"
              strokeWidth={2}
              fill="var(--color-trend)"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            <Bar
              dataKey="revenue"
              fill="var(--color-revenue)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </ComposedChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
