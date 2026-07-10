import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { TrendChart } from "@/components/charts/trend-chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Line chart showcase (W5): a single-series trend and a multi-series comparison,
 * both drawn with the shared TrendChart (line variant) so every stroke resolves
 * from the --chart-* tokens.
 */

const SINGLE = [
  { label: "Jan", visitors: 3200 },
  { label: "Feb", visitors: 4100 },
  { label: "Mar", visitors: 3800 },
  { label: "Apr", visitors: 5200 },
  { label: "May", visitors: 6100 },
  { label: "Jun", visitors: 5800 },
];

const MULTI = [
  { label: "Jan", desktop: 3200, mobile: 1800 },
  { label: "Feb", desktop: 4100, mobile: 2400 },
  { label: "Mar", desktop: 3800, mobile: 2900 },
  { label: "Apr", desktop: 5200, mobile: 3600 },
  { label: "May", desktop: 6100, mobile: 4300 },
  { label: "Jun", desktop: 5800, mobile: 4800 },
];

export function ChartsLinePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.line.title")}
      description={t("showcase.charts.line.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<TrendChart
  variant="line"
  data={data}
  seriesList={[{ key: "visitors", label: "Visitors", color: "var(--chart-1)" }]}
  ariaLabel="Monthly visitors"
/>`}
      >
        <TrendChart
          variant="line"
          data={SINGLE}
          seriesList={[
            {
              key: "visitors",
              label: t("showcase.charts.line.visitors"),
              color: "var(--chart-1)",
            },
          ]}
          ariaLabel={t("showcase.charts.line.title")}
          formatValue={(value) => value.toLocaleString()}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.multiSeries")}
        previewClassName="block"
        code={`<TrendChart
  variant="line"
  data={data}
  seriesList={[
    { key: "desktop", label: "Desktop", color: "var(--chart-1)" },
    { key: "mobile", label: "Mobile", color: "var(--chart-2)" },
  ]}
  ariaLabel="Sessions by device"
/>`}
      >
        <TrendChart
          variant="line"
          data={MULTI}
          seriesList={[
            {
              key: "desktop",
              label: t("showcase.charts.s.desktop"),
              color: "var(--chart-1)",
            },
            {
              key: "mobile",
              label: t("showcase.charts.s.mobile"),
              color: "var(--chart-2)",
            },
          ]}
          ariaLabel={t("showcase.charts.line.title")}
          formatValue={(value) => value.toLocaleString()}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
