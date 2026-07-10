import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Radial bar showcase (W5): Recharts RadialBarChart on --chart-* tokens — a
 * stacked multi-track chart and a single-value progress gauge.
 */

const TRACKS = [
  { label: "Design", value: 86, fill: "var(--chart-1)" },
  { label: "Frontend", value: 72, fill: "var(--chart-2)" },
  { label: "Backend", value: 64, fill: "var(--chart-3)" },
  { label: "QA", value: 48, fill: "var(--chart-4)" },
];

const GAUGE = [{ label: "Progress", value: 68, fill: "var(--chart-1)" }];

const tracksConfig: ChartConfig = Object.fromEntries(
  TRACKS.map((row, index) => [
    row.label,
    { label: row.label, color: `var(--chart-${(index % 5) + 1})` },
  ]),
);
const gaugeConfig: ChartConfig = {
  Progress: { label: "Progress", color: "var(--chart-1)" },
};

export function ChartsRadialbarPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.radialbar.title")}
      description={t("showcase.charts.radialbar.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.tracks")}
        previewClassName="block"
        code={`<RadialBarChart data={data} innerRadius={30} outerRadius={110}>
  <RadialBar dataKey="value" background cornerRadius={6} />
</RadialBarChart>`}
      >
        <ChartContainer
          config={tracksConfig}
          ariaLabel={t("showcase.charts.radialbar.title")}
          className="aspect-square h-[260px]"
        >
          <RadialBarChart
            data={TRACKS}
            innerRadius={30}
            outerRadius={112}
            startAngle={90}
            endAngle={-270}
          >
            <ChartTooltip
              content={<ChartTooltipContent nameKey="label" hideLabel />}
            />
            <RadialBar dataKey="value" background cornerRadius={6} />
          </RadialBarChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.progress")}
        notes={t("showcase.charts.radialbar.gaugeNote")}
        previewClassName="block"
        code={`<RadialBarChart
  data={[{ value: 68 }]}
  innerRadius={70}
  outerRadius={110}
  startAngle={90}
  endAngle={90 - (68 / 100) * 360}
>
  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
  <RadialBar dataKey="value" cornerRadius={12} background />
</RadialBarChart>`}
      >
        <ChartContainer
          config={gaugeConfig}
          ariaLabel={t("showcase.charts.s.progress")}
          className="relative aspect-square h-[220px]"
        >
          <RadialBarChart
            data={GAUGE}
            innerRadius={72}
            outerRadius={110}
            startAngle={90}
            endAngle={90 - (GAUGE[0].value / 100) * 360}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar dataKey="value" cornerRadius={12} background />
          </RadialBarChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
