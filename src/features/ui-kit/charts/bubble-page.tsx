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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Bubble chart showcase (W5): a Recharts ScatterChart where a third dimension
 * drives the marker size via ZAxis. A single series and a two-group comparison,
 * each bubble filled from a --chart-* token.
 */

interface Bubble {
  name: string;
  x: number;
  y: number;
  z: number;
}

const SINGLE: Bubble[] = [
  { name: "Alpha", x: 12, y: 28, z: 420 },
  { name: "Bravo", x: 24, y: 44, z: 980 },
  { name: "Charlie", x: 38, y: 22, z: 260 },
  { name: "Delta", x: 46, y: 58, z: 1400 },
  { name: "Echo", x: 58, y: 36, z: 640 },
  { name: "Foxtrot", x: 68, y: 66, z: 1120 },
];

const GROUP_A: Bubble[] = [
  { name: "A1", x: 14, y: 32, z: 360 },
  { name: "A2", x: 30, y: 48, z: 820 },
  { name: "A3", x: 52, y: 40, z: 540 },
  { name: "A4", x: 64, y: 62, z: 1200 },
];

const GROUP_B: Bubble[] = [
  { name: "B1", x: 20, y: 20, z: 300 },
  { name: "B2", x: 38, y: 34, z: 700 },
  { name: "B3", x: 48, y: 54, z: 980 },
  { name: "B4", x: 70, y: 46, z: 620 },
];

const SINGLE_CONFIG: ChartConfig = {
  markets: { label: "Markets", color: "var(--chart-1)" },
};

const GROUP_CONFIG: ChartConfig = {
  groupA: { label: "Segment A", color: "var(--chart-1)" },
  groupB: { label: "Segment B", color: "var(--chart-4)" },
};

function BubbleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Bubble }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-medium">{point.name}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">x</span>
        <span className="text-right">{point.x}</span>
        <span className="text-muted-foreground">y</span>
        <span className="text-right">{point.y}</span>
        <span className="text-muted-foreground">size</span>
        <span className="text-right">{point.z.toLocaleString()}</span>
      </div>
    </div>
  );
}

export function ChartsBubblePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.bubble.title")}
      description={t("showcase.charts.bubble.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        previewClassName="block"
        code={`<ScatterChart>
  <XAxis type="number" dataKey="x" />
  <YAxis type="number" dataKey="y" />
  <ZAxis type="number" dataKey="z" range={[80, 480]} />
  <Scatter data={data} fill="var(--color-markets)" fillOpacity={0.6} />
</ScatterChart>`}
      >
        <ChartContainer
          config={SINGLE_CONFIG}
          ariaLabel={t("showcase.charts.bubble.title")}
          className="aspect-auto w-full"
          style={{ height: 280 }}
        >
          <ScatterChart margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              type="number"
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 480]} />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<BubbleTooltip />}
            />
            <Scatter
              data={SINGLE}
              fill="var(--color-markets)"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.multiSeries")}
        previewClassName="block"
        code={`<ScatterChart>
  <ZAxis type="number" dataKey="z" range={[80, 480]} />
  <Scatter name="Segment A" data={groupA} fill="var(--color-groupA)" fillOpacity={0.6} />
  <Scatter name="Segment B" data={groupB} fill="var(--color-groupB)" fillOpacity={0.6} />
</ScatterChart>`}
      >
        <ChartContainer
          config={GROUP_CONFIG}
          ariaLabel={t("showcase.charts.bubble.title")}
          className="aspect-auto w-full"
          style={{ height: 280 }}
        >
          <ScatterChart margin={{ top: 12, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              type="number"
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              type="number"
              dataKey="y"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <ZAxis type="number" dataKey="z" range={[80, 480]} />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={<BubbleTooltip />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Scatter
              name="groupA"
              data={GROUP_A}
              fill="var(--color-groupA)"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
            <Scatter
              name="groupB"
              data={GROUP_B}
              fill="var(--color-groupB)"
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
