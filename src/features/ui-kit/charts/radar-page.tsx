import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
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
 * Radar chart showcase (W5): Recharts RadarChart on --chart-* tokens — a single
 * skill profile and a two-series comparison.
 */

const SKILLS = [
  { axis: "Speed", a: 82 },
  { axis: "Power", a: 68 },
  { axis: "Range", a: 74 },
  { axis: "Defense", a: 60 },
  { axis: "Control", a: 88 },
  { axis: "Stamina", a: 71 },
];

const COMPARE = [
  { axis: "Speed", a: 82, b: 64 },
  { axis: "Power", a: 68, b: 78 },
  { axis: "Range", a: 74, b: 70 },
  { axis: "Defense", a: 60, b: 84 },
  { axis: "Control", a: 88, b: 66 },
  { axis: "Stamina", a: 71, b: 80 },
];

const singleConfig: ChartConfig = {
  a: { label: "Current", color: "var(--chart-1)" },
};
const compareConfig: ChartConfig = {
  a: { label: "Player A", color: "var(--chart-1)" },
  b: { label: "Player B", color: "var(--chart-2)" },
};

export function ChartsRadarPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.radar.title")}
      description={t("showcase.charts.radar.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.profile")}
        previewClassName="block"
        code={`<RadarChart data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="axis" />
  <Radar dataKey="a" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.4} />
</RadarChart>`}
      >
        <ChartContainer
          config={singleConfig}
          ariaLabel={t("showcase.charts.radar.title")}
          className="aspect-square h-[280px]"
        >
          <RadarChart data={SKILLS}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              dataKey="a"
              stroke="var(--color-a)"
              fill="var(--color-a)"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.compare")}
        previewClassName="block"
        code={`<RadarChart data={data}>
  <Radar dataKey="a" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.3} />
  <Radar dataKey="b" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.3} />
</RadarChart>`}
      >
        <ChartContainer
          config={compareConfig}
          ariaLabel={t("showcase.charts.s.compare")}
          className="aspect-square h-[300px]"
        >
          <RadarChart data={COMPARE}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Radar
              dataKey="a"
              stroke="var(--color-a)"
              fill="var(--color-a)"
              fillOpacity={0.3}
            />
            <Radar
              dataKey="b"
              stroke="var(--color-b)"
              fill="var(--color-b)"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
