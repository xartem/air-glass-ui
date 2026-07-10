import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { TrendChart } from "@/components/charts/trend-chart";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Area chart showcase (W5): a gradient-filled single series via the shared
 * TrendChart, plus a stacked composition built directly on the chart wrapper.
 * All fills resolve from --chart-* tokens.
 */

const SINGLE = [
  { label: "Jan", revenue: 12400 },
  { label: "Feb", revenue: 15200 },
  { label: "Mar", revenue: 14100 },
  { label: "Apr", revenue: 18700 },
  { label: "May", revenue: 21300 },
  { label: "Jun", revenue: 19800 },
];

const STACKED = [
  { label: "Jan", organic: 3200, paid: 1800, referral: 900 },
  { label: "Feb", organic: 3600, paid: 2100, referral: 1200 },
  { label: "Mar", organic: 3400, paid: 2500, referral: 1100 },
  { label: "Apr", organic: 4200, paid: 2800, referral: 1500 },
  { label: "May", organic: 4800, paid: 3200, referral: 1700 },
  { label: "Jun", organic: 4500, paid: 3600, referral: 2000 },
];

const STACKED_CONFIG: ChartConfig = {
  organic: { label: "Organic", color: "var(--chart-1)" },
  paid: { label: "Paid", color: "var(--chart-2)" },
  referral: { label: "Referral", color: "var(--chart-3)" },
};

export function ChartsAreaPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.area.title")}
      description={t("showcase.charts.area.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<TrendChart
  variant="area"
  data={data}
  seriesList={[{ key: "revenue", label: "Revenue", color: "var(--chart-1)" }]}
  ariaLabel="Monthly revenue"
/>`}
      >
        <TrendChart
          variant="area"
          data={SINGLE}
          seriesList={[
            {
              key: "revenue",
              label: t("showcase.charts.area.revenue"),
              color: "var(--chart-1)",
            },
          ]}
          ariaLabel={t("showcase.charts.area.title")}
          formatValue={(value) => `$${value.toLocaleString()}`}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.stacked")}
        previewClassName="block"
        code={`<AreaChart data={data}>
  <Area dataKey="organic" stackId="s" stroke="var(--color-organic)" fill="var(--color-organic)" />
  <Area dataKey="paid" stackId="s" stroke="var(--color-paid)" fill="var(--color-paid)" />
  <Area dataKey="referral" stackId="s" stroke="var(--color-referral)" fill="var(--color-referral)" />
</AreaChart>`}
      >
        <ChartContainer
          config={STACKED_CONFIG}
          ariaLabel={t("showcase.charts.area.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <AreaChart
            data={STACKED}
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
            {(["organic", "paid", "referral"] as const).map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="monotone"
                stackId="s"
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                fill={`var(--color-${key})`}
                fillOpacity={0.2}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
