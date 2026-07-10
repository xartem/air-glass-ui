import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Heatmap } from "@/components/charts/heatmap";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Heatmap showcase (W5): the custom grid Heatmap composition. Cell intensity
 * maps onto a single --chart-* token via color-mix, so it stays on-palette in
 * both skins. Recharts ships no categorical heatmap, hence the custom build.
 */

const HOURS = ["9a", "11a", "1p", "3p", "5p", "7p"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// values[day][hour]
const ACTIVITY = [
  [3, 12, 28, 22, 9, 4],
  [5, 18, 34, 30, 14, 6],
  [8, 24, 40, 38, 20, 10],
  [6, 20, 36, 31, 16, 7],
  [4, 15, 26, 24, 11, 5],
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const REGIONS = ["NA", "EU", "APAC"];
const SALES = [
  [42, 55, 61, 58, 70, 82],
  [30, 38, 44, 50, 47, 60],
  [18, 22, 27, 33, 40, 51],
];

export function ChartsHeatmapPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.heatmap.title")}
      description={t("showcase.charts.heatmap.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.activity")}
        notes={t("showcase.charts.heatmap.note")}
        previewClassName="block"
        code={`<Heatmap
  xLabels={hours}
  yLabels={days}
  values={activity}
  colorToken="var(--chart-1)"
  ariaLabel="Weekly activity"
/>`}
      >
        <Heatmap
          xLabels={HOURS}
          yLabels={DAYS}
          values={ACTIVITY}
          colorToken="var(--chart-1)"
          ariaLabel={t("showcase.charts.s.activity")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.scale")}
        previewClassName="block"
        code={`<Heatmap
  xLabels={months}
  yLabels={regions}
  values={sales}
  colorToken="var(--chart-2)"
  ariaLabel="Sales by region"
/>`}
      >
        <Heatmap
          xLabels={MONTHS}
          yLabels={REGIONS}
          values={SALES}
          colorToken="var(--chart-2)"
          ariaLabel={t("showcase.charts.s.scale")}
          formatValue={(value) => `${value}k`}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
