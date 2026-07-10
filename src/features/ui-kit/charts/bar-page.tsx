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
 * Bar chart showcase (W5): horizontal bars for ranked categories. A ranked
 * single series via the shared CategoryBars, and a stacked composition built on
 * the chart wrapper — every fill resolves from --chart-* tokens.
 */

const RANKED = [
  { label: "Direct", value: 4200 },
  { label: "Search", value: 3600 },
  { label: "Social", value: 2400 },
  { label: "Email", value: 1500 },
  { label: "Referral", value: 900 },
];

const STACKED = [
  { label: "Team A", done: 32, active: 12, blocked: 4 },
  { label: "Team B", done: 24, active: 18, blocked: 6 },
  { label: "Team C", done: 40, active: 8, blocked: 2 },
  { label: "Team D", done: 18, active: 22, blocked: 9 },
];

const STACKED_CONFIG: ChartConfig = {
  done: { label: "Done", color: "var(--chart-1)" },
  active: { label: "Active", color: "var(--chart-2)" },
  blocked: { label: "Blocked", color: "var(--chart-3)" },
};

export function ChartsBarPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.bar.title")}
      description={t("showcase.charts.bar.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.ranked")}
        previewClassName="block"
        code={`<CategoryBars
  orientation="horizontal"
  data={data}
  ariaLabel="Sessions by source"
/>`}
      >
        <CategoryBars
          orientation="horizontal"
          data={RANKED}
          ariaLabel={t("showcase.charts.bar.title")}
          formatValue={(value) => value.toLocaleString()}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.stacked")}
        previewClassName="block"
        code={`<BarChart layout="vertical" data={data}>
  <Bar dataKey="done" stackId="s" fill="var(--color-done)" />
  <Bar dataKey="active" stackId="s" fill="var(--color-active)" />
  <Bar dataKey="blocked" stackId="s" fill="var(--color-blocked)" />
</BarChart>`}
      >
        <ChartContainer
          config={STACKED_CONFIG}
          ariaLabel={t("showcase.charts.bar.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <BarChart
            data={STACKED}
            layout="vertical"
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
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
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="done"
              stackId="s"
              fill="var(--color-done)"
              radius={[4, 0, 0, 4]}
              maxBarSize={26}
            />
            <Bar
              dataKey="active"
              stackId="s"
              fill="var(--color-active)"
              maxBarSize={26}
            />
            <Bar
              dataKey="blocked"
              stackId="s"
              fill="var(--color-blocked)"
              radius={[0, 4, 4, 0]}
              maxBarSize={26}
            />
          </BarChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
