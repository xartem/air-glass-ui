import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { BoxPlot } from "@/components/charts/boxplot";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Box-and-whisker showcase (W5): five-number summaries (min, Q1, median, Q3,
 * max) per category via the custom BoxPlot composition. A single-hue variant and
 * a per-category multi-colour variant, all filled from --chart-* tokens.
 */

const LATENCY = [
  { label: "API", min: 42, q1: 68, median: 88, q3: 112, max: 168 },
  { label: "DB", min: 18, q1: 30, median: 44, q3: 62, max: 98 },
  { label: "Cache", min: 4, q1: 8, median: 12, q3: 20, max: 41 },
  { label: "Edge", min: 22, q1: 38, median: 51, q3: 70, max: 120 },
];

const SCORES = [
  { label: "Team A", min: 55, q1: 68, median: 76, q3: 84, max: 96 },
  { label: "Team B", min: 48, q1: 60, median: 71, q3: 80, max: 92 },
  { label: "Team C", min: 62, q1: 72, median: 79, q3: 88, max: 99 },
  { label: "Team D", min: 40, q1: 58, median: 66, q3: 75, max: 90 },
  { label: "Team E", min: 50, q1: 64, median: 73, q3: 82, max: 95 },
];

export function ChartsBoxplotPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.boxplot.title")}
      description={t("showcase.charts.boxplot.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.boxplot.latency")}
        notes={t("showcase.charts.boxplot.note")}
        previewClassName="block"
        code={`<BoxPlot
  data={data}
  multiColor={false}
  ariaLabel="Latency distribution"
  formatValue={(value) => \`\${value}ms\`}
/>`}
      >
        <BoxPlot
          data={LATENCY}
          multiColor={false}
          ariaLabel={t("showcase.charts.boxplot.title")}
          formatValue={(value) => `${value}ms`}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.boxplot.scores")}
        previewClassName="block"
        code={`<BoxPlot
  data={data}
  ariaLabel="Score distribution"
/>`}
      >
        <BoxPlot data={SCORES} ariaLabel={t("showcase.charts.boxplot.title")} />
      </ComponentDemo>
    </ShowcasePage>
  );
}
