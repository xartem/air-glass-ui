import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { CategoryBars } from "@/components/charts/category-bars";
import { TrendChart, type TrendSeries } from "@/components/charts/trend-chart";
import { Donut } from "@/components/charts/donut";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * "Chart.js" showcase (W5): this template ships Recharts, not Chart.js. This page
 * makes the substitution explicit and renders the equivalent chart types (line,
 * bar, doughnut) with the shared Recharts compositions on --chart-* tokens.
 */

const LINE = [
  { label: "Jan", visits: 1200 },
  { label: "Feb", visits: 1800 },
  { label: "Mar", visits: 1500 },
  { label: "Apr", visits: 2200 },
  { label: "May", visits: 2600 },
  { label: "Jun", visits: 2400 },
];
const LINE_SERIES: TrendSeries[] = [
  { key: "visits", label: "Visits", color: "var(--chart-1)" },
];

const BARS = [
  { label: "Q1", value: 42 },
  { label: "Q2", value: 58 },
  { label: "Q3", value: 51 },
  { label: "Q4", value: 66 },
];

const DOUGHNUT = [
  { label: "Desktop", value: 58 },
  { label: "Mobile", value: 34 },
  { label: "Tablet", value: 8 },
];

export function ChartsChartjsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.chartjs.title")}
      description={t("showcase.charts.chartjs.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <p className="glass-card rounded-2xl border border-[var(--glass-border)] px-5 py-4 text-sm text-muted-foreground">
        {t("showcase.charts.chartjs.substitution")}
      </p>

      <ComponentDemo
        title={t("showcase.charts.s.lineEquivalent")}
        notes={t("showcase.charts.substitutionNote")}
        previewClassName="block"
        code={`// Chart.js "line" → Recharts LineChart
<TrendChart data={data} seriesList={series} variant="line" />`}
      >
        <TrendChart
          data={LINE}
          seriesList={LINE_SERIES}
          variant="line"
          ariaLabel={t("showcase.charts.s.lineEquivalent")}
          formatValue={(value) => value.toLocaleString()}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.barEquivalent")}
        previewClassName="block"
        code={`// Chart.js "bar" → Recharts BarChart
<CategoryBars data={data} orientation="vertical" />`}
      >
        <CategoryBars
          data={BARS}
          orientation="vertical"
          ariaLabel={t("showcase.charts.s.barEquivalent")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.doughnutEquivalent")}
        previewClassName="block"
        code={`// Chart.js "doughnut" → Recharts Pie (inner radius)
<Donut data={data} ariaLabel="Devices" />`}
      >
        <Donut
          data={DOUGHNUT}
          ariaLabel={t("showcase.charts.s.doughnutEquivalent")}
          formatValue={(value) => `${value}%`}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
