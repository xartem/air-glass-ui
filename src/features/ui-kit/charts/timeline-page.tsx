import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { TrendChart } from "@/components/charts/trend-chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Timeline chart showcase (W5): a continuous time series over dated buckets.
 * A filled area for a single metric and a multi-series line comparison, both via
 * the shared TrendChart so every stroke/fill comes from a --chart-* token.
 */

const AREA = [
  { label: "Jul 1", sessions: 1240 },
  { label: "Jul 2", sessions: 1580 },
  { label: "Jul 3", sessions: 1410 },
  { label: "Jul 4", sessions: 1890 },
  { label: "Jul 5", sessions: 2130 },
  { label: "Jul 6", sessions: 1760 },
  { label: "Jul 7", sessions: 2240 },
];

const LINES = [
  { label: "Jul 1", cpu: 42, memory: 61 },
  { label: "Jul 2", cpu: 55, memory: 64 },
  { label: "Jul 3", cpu: 48, memory: 58 },
  { label: "Jul 4", cpu: 71, memory: 73 },
  { label: "Jul 5", cpu: 66, memory: 79 },
  { label: "Jul 6", cpu: 52, memory: 70 },
  { label: "Jul 7", cpu: 60, memory: 68 },
];

export function ChartsTimelinePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.timeline.title")}
      description={t("showcase.charts.timeline.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.timeline.sessions")}
        previewClassName="block"
        code={`<TrendChart
  variant="area"
  data={data}
  seriesList={[{ key: "sessions", label: "Sessions", color: "var(--chart-1)" }]}
  ariaLabel="Sessions over time"
/>`}
      >
        <TrendChart
          variant="area"
          data={AREA}
          seriesList={[
            {
              key: "sessions",
              label: t("showcase.charts.timeline.sessions"),
              color: "var(--chart-1)",
            },
          ]}
          ariaLabel={t("showcase.charts.timeline.title")}
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
    { key: "cpu", label: "CPU %", color: "var(--chart-1)" },
    { key: "memory", label: "Memory %", color: "var(--chart-4)" },
  ]}
  ariaLabel="Resource usage over time"
/>`}
      >
        <TrendChart
          variant="line"
          data={LINES}
          seriesList={[
            {
              key: "cpu",
              label: t("showcase.charts.timeline.cpu"),
              color: "var(--chart-1)",
            },
            {
              key: "memory",
              label: t("showcase.charts.timeline.memory"),
              color: "var(--chart-4)",
            },
          ]}
          ariaLabel={t("showcase.charts.timeline.title")}
          formatValue={(value) => `${value}%`}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
