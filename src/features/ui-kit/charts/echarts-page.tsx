import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { CategoryBars } from "@/components/charts/category-bars";
import { MarketTreemap } from "@/components/charts/treemap";
import { TrendChart, type TrendSeries } from "@/components/charts/trend-chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * "ECharts" showcase (W5): this template ships Recharts, not ECharts. This page
 * makes the substitution explicit and renders equivalent chart types (area, bar,
 * treemap) with the shared Recharts compositions on --chart-* tokens.
 */

const AREA = [
  { label: "Mon", load: 34, peak: 52 },
  { label: "Tue", load: 41, peak: 58 },
  { label: "Wed", load: 38, peak: 61 },
  { label: "Thu", load: 47, peak: 66 },
  { label: "Fri", load: 52, peak: 72 },
  { label: "Sat", load: 30, peak: 44 },
  { label: "Sun", load: 24, peak: 38 },
];
const AREA_SERIES: TrendSeries[] = [
  { key: "load", label: "Load", color: "var(--chart-1)" },
  { key: "peak", label: "Peak", color: "var(--chart-2)" },
];

const BARS = [
  { label: "APAC", value: 61 },
  { label: "EMEA", value: 48 },
  { label: "LATAM", value: 33 },
  { label: "NA", value: 72 },
];

const TREE = [
  { label: "Compute", value: 320 },
  { label: "Storage", value: 180 },
  { label: "Network", value: 120 },
  { label: "Database", value: 90 },
  { label: "Other", value: 46 },
];

export function ChartsEchartsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.echarts.title")}
      description={t("showcase.charts.echarts.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <p className="glass-card rounded-2xl border border-[var(--glass-border)] px-5 py-4 text-sm text-muted-foreground">
        {t("showcase.charts.echarts.substitution")}
      </p>

      <ComponentDemo
        title={t("showcase.charts.s.areaEquivalent")}
        notes={t("showcase.charts.substitutionNote")}
        previewClassName="block"
        code={`// ECharts "line/area" → Recharts AreaChart
<TrendChart data={data} seriesList={series} variant="area" />`}
      >
        <TrendChart
          data={AREA}
          seriesList={AREA_SERIES}
          variant="area"
          ariaLabel={t("showcase.charts.s.areaEquivalent")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.barEquivalent")}
        previewClassName="block"
        code={`// ECharts "bar" → Recharts BarChart
<CategoryBars data={data} orientation="horizontal" />`}
      >
        <CategoryBars
          data={BARS}
          orientation="horizontal"
          ariaLabel={t("showcase.charts.s.barEquivalent")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.treemapEquivalent")}
        previewClassName="block"
        code={`// ECharts "treemap" → Recharts Treemap
<MarketTreemap data={data} ariaLabel="Cloud spend" />`}
      >
        <MarketTreemap
          data={TREE}
          ariaLabel={t("showcase.charts.s.treemapEquivalent")}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
