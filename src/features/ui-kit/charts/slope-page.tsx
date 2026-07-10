import {
  Line,
  LineChart,
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
 * Slope chart showcase (W5): a two-point Recharts LineChart comparing a Before
 * and After period per series. Line colors come only from --chart-* tokens.
 */

// Each row = one period column; each series is a line across the two points.
const REVENUE = [
  { period: "2023", north: 42, south: 30, west: 18 },
  { period: "2024", north: 58, south: 26, west: 34 },
];

const SATISFACTION = [
  { period: "Before", support: 62, product: 71, billing: 48 },
  { period: "After", support: 78, product: 74, billing: 66 },
];

const revenueConfig: ChartConfig = {
  north: { label: "North", color: "var(--chart-1)" },
  south: { label: "South", color: "var(--chart-2)" },
  west: { label: "West", color: "var(--chart-3)" },
};
const satisfactionConfig: ChartConfig = {
  support: { label: "Support", color: "var(--chart-1)" },
  product: { label: "Product", color: "var(--chart-4)" },
  billing: { label: "Billing", color: "var(--chart-3)" },
};

function SlopeChart({
  data,
  config,
  ariaLabel,
}: {
  data: readonly object[];
  config: ChartConfig;
  ariaLabel: string;
}) {
  const keys = Object.keys(config);
  return (
    <ChartContainer
      config={config}
      ariaLabel={ariaLabel}
      className="aspect-auto h-[280px] w-full"
    >
      <LineChart
        data={data as never}
        margin={{ top: 16, right: 48, bottom: 8, left: 48 }}
      >
        <XAxis
          dataKey="period"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          padding={{ left: 24, right: 24 }}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {keys.map((key) => (
          <Line
            key={key}
            dataKey={key}
            type="linear"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 0, fill: `var(--color-${key})` }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

export function ChartsSlopePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.slope.title")}
      description={t("showcase.charts.slope.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.change")}
        notes={t("showcase.charts.slope.note")}
        previewClassName="block"
        code={`<LineChart data={data}>
  <XAxis dataKey="period" />
  <YAxis hide domain={["dataMin - 8", "dataMax + 8"]} />
  <Line dataKey="north" stroke="var(--chart-1)" dot={{ r: 4 }} />
  <Line dataKey="south" stroke="var(--chart-2)" dot={{ r: 4 }} />
</LineChart>`}
      >
        <SlopeChart
          data={REVENUE}
          config={revenueConfig}
          ariaLabel={t("showcase.charts.slope.title")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.beforeAfter")}
        previewClassName="block"
        code={`<SlopeChart data={satisfaction} config={config} />`}
      >
        <SlopeChart
          data={SATISFACTION}
          config={satisfactionConfig}
          ariaLabel={t("showcase.charts.s.beforeAfter")}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
