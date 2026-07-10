import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { CategoryBars } from "@/components/charts/category-bars";
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
 * Column chart showcase (W5): vertical bars over a period bucket. A single
 * series via the shared CategoryBars, and a grouped two-series composition
 * built on the chart wrapper — all bars filled from --chart-* tokens.
 */

const SINGLE = [
  { label: "Mon", value: 42 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 71 },
  { label: "Thu", value: 49 },
  { label: "Fri", value: 83 },
  { label: "Sat", value: 34 },
  { label: "Sun", value: 27 },
];

const GROUPED = [
  { label: "Q1", thisYear: 120, lastYear: 90 },
  { label: "Q2", thisYear: 168, lastYear: 132 },
  { label: "Q3", thisYear: 145, lastYear: 158 },
  { label: "Q4", thisYear: 192, lastYear: 164 },
];

const GROUPED_CONFIG: ChartConfig = {
  thisYear: { label: "This year", color: "var(--chart-1)" },
  lastYear: { label: "Last year", color: "var(--chart-2)" },
};

export function ChartsColumnPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.column.title")}
      description={t("showcase.charts.column.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<CategoryBars
  orientation="vertical"
  multiColor={false}
  data={data}
  ariaLabel="Orders per weekday"
/>`}
      >
        <CategoryBars
          orientation="vertical"
          multiColor={false}
          data={SINGLE}
          ariaLabel={t("showcase.charts.column.title")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.grouped")}
        previewClassName="block"
        code={`<BarChart data={data}>
  <Bar dataKey="thisYear" fill="var(--color-thisYear)" radius={[4, 4, 0, 0]} />
  <Bar dataKey="lastYear" fill="var(--color-lastYear)" radius={[4, 4, 0, 0]} />
</BarChart>`}
      >
        <ChartContainer
          config={GROUPED_CONFIG}
          ariaLabel={t("showcase.charts.column.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <BarChart
            data={GROUPED}
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
            <Bar
              dataKey="thisYear"
              fill="var(--color-thisYear)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="lastYear"
              fill="var(--color-lastYear)"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
