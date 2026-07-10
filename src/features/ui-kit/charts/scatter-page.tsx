import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

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
 * Scatter chart showcase (W5): Recharts ScatterChart on --chart-* tokens — a
 * single cloud, a Z-axis bubble variant, and two overlaid series.
 */

const BASIC = [
  { x: 12, y: 22 },
  { x: 18, y: 30 },
  { x: 24, y: 18 },
  { x: 31, y: 42 },
  { x: 38, y: 35 },
  { x: 45, y: 55 },
  { x: 52, y: 48 },
  { x: 60, y: 66 },
  { x: 68, y: 58 },
  { x: 74, y: 78 },
];

const BUBBLE = [
  { x: 15, y: 20, z: 120 },
  { x: 28, y: 45, z: 260 },
  { x: 40, y: 30, z: 90 },
  { x: 52, y: 62, z: 320 },
  { x: 64, y: 48, z: 180 },
  { x: 76, y: 72, z: 400 },
];

const GROUP_A = [
  { x: 10, y: 30 },
  { x: 22, y: 44 },
  { x: 34, y: 38 },
  { x: 46, y: 58 },
  { x: 58, y: 52 },
];
const GROUP_B = [
  { x: 16, y: 18 },
  { x: 30, y: 26 },
  { x: 42, y: 20 },
  { x: 54, y: 34 },
  { x: 66, y: 28 },
];

const basicConfig: ChartConfig = {
  points: { label: "Samples", color: "var(--chart-1)" },
};
const bubbleConfig: ChartConfig = {
  points: { label: "Accounts", color: "var(--chart-3)" },
};
const groupConfig: ChartConfig = {
  groupA: { label: "Cohort A", color: "var(--chart-1)" },
  groupB: { label: "Cohort B", color: "var(--chart-2)" },
};

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

export function ChartsScatterPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.scatter.title")}
      description={t("showcase.charts.scatter.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.basic")}
        code={`<ScatterChart>
  <CartesianGrid />
  <XAxis dataKey="x" type="number" />
  <YAxis dataKey="y" type="number" />
  <Scatter data={data} fill="var(--chart-1)" />
</ScatterChart>`}
      >
        <ChartContainer
          config={basicConfig}
          ariaLabel={t("showcase.charts.scatter.title")}
          className="aspect-auto h-[260px] w-full"
        >
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <YAxis
              dataKey="y"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Scatter
              name="points"
              data={BASIC}
              fill="var(--chart-1)"
              fillOpacity={0.8}
            />
          </ScatterChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.bubble")}
        notes={t("showcase.charts.scatter.bubbleNote")}
        code={`<ScatterChart>
  <ZAxis dataKey="z" range={[80, 480]} />
  <Scatter data={data} fill="var(--chart-3)" />
</ScatterChart>`}
      >
        <ChartContainer
          config={bubbleConfig}
          ariaLabel={t("showcase.charts.s.bubble")}
          className="aspect-auto h-[260px] w-full"
        >
          <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <YAxis
              dataKey="y"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <ZAxis dataKey="z" type="number" range={[80, 480]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Scatter
              name="points"
              data={BUBBLE}
              fill="var(--chart-3)"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.multiSeries")}
        code={`<ScatterChart>
  <Scatter data={groupA} fill="var(--chart-1)" />
  <Scatter data={groupB} fill="var(--chart-2)" />
</ScatterChart>`}
      >
        <ChartContainer
          config={groupConfig}
          ariaLabel={t("showcase.charts.s.multiSeries")}
          className="aspect-auto h-[260px] w-full"
        >
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="x"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <YAxis
              dataKey="y"
              type="number"
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Scatter
              name="groupA"
              data={GROUP_A}
              fill="var(--chart-1)"
              fillOpacity={0.85}
            />
            <Scatter
              name="groupB"
              data={GROUP_B}
              fill="var(--chart-2)"
              fillOpacity={0.85}
            />
          </ScatterChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
