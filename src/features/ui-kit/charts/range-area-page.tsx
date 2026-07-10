import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Range-area (band) showcase (W5): the shaded region between a lower and upper
 * bound, drawn as a transparent baseline area stacked under a filled band area.
 * Band fill and the mean line both resolve from --chart-* tokens.
 */

interface RangePoint {
  label: string;
  lower: number;
  upper: number;
}

const RAW: RangePoint[] = [
  { label: "Jan", lower: 42, upper: 68 },
  { label: "Feb", lower: 48, upper: 74 },
  { label: "Mar", lower: 45, upper: 71 },
  { label: "Apr", lower: 52, upper: 82 },
  { label: "May", lower: 58, upper: 88 },
  { label: "Jun", lower: 55, upper: 79 },
];

const DATA = RAW.map((point) => ({
  ...point,
  base: point.lower,
  band: point.upper - point.lower,
  mean: Math.round((point.lower + point.upper) / 2),
}));

const CONFIG: ChartConfig = {
  band: { label: "Range", color: "var(--chart-1)" },
  mean: { label: "Mean", color: "var(--chart-2)" },
};

function RangeTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: (typeof DATA)[number] }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-medium">{point.label}</div>
      <div className="grid grid-cols-2 gap-x-3 tabular-nums">
        <span className="text-muted-foreground">High</span>
        <span className="text-right">{point.upper}</span>
        <span className="text-muted-foreground">Low</span>
        <span className="text-right">{point.lower}</span>
      </div>
    </div>
  );
}

export function ChartsRangeAreaPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.rangeArea.title")}
      description={t("showcase.charts.rangeArea.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.rangeArea.band")}
        previewClassName="block"
        code={`<AreaChart data={data}>
  {/* transparent baseline lifts the band to its lower bound */}
  <Area dataKey="base" stackId="r" stroke="none" fill="transparent" />
  <Area dataKey="band" stackId="r" stroke="var(--color-band)" fill="var(--color-band)" fillOpacity={0.2} />
</AreaChart>`}
      >
        <ChartContainer
          config={CONFIG}
          ariaLabel={t("showcase.charts.rangeArea.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <AreaChart
            data={DATA}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <ChartTooltip content={<RangeTooltip />} />
            <Area
              dataKey="base"
              stackId="r"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              dataKey="band"
              type="monotone"
              stackId="r"
              stroke="var(--color-band)"
              strokeWidth={1.5}
              fill="var(--color-band)"
              fillOpacity={0.2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.rangeArea.withMean")}
        previewClassName="block"
        code={`<AreaChart data={data}>
  <Area dataKey="base" stackId="r" stroke="none" fill="transparent" />
  <Area dataKey="band" stackId="r" stroke="none" fill="var(--color-band)" fillOpacity={0.18} />
  <Line dataKey="mean" stroke="var(--color-mean)" strokeWidth={2} dot={false} />
</AreaChart>`}
      >
        <ChartContainer
          config={CONFIG}
          ariaLabel={t("showcase.charts.rangeArea.title")}
          className="aspect-auto w-full"
          style={{ height: 260 }}
        >
          <ComposedChart
            data={DATA}
            margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              stroke="var(--border)"
              strokeOpacity={0.6}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis hide />
            <ChartTooltip content={<RangeTooltip />} />
            <Area
              dataKey="base"
              stackId="r"
              stroke="none"
              fill="transparent"
              isAnimationActive={false}
            />
            <Area
              dataKey="band"
              type="monotone"
              stackId="r"
              stroke="none"
              fill="var(--color-band)"
              fillOpacity={0.18}
              isAnimationActive={false}
            />
            <Line
              dataKey="mean"
              type="monotone"
              stroke="var(--color-mean)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </ComponentDemo>
    </ShowcasePage>
  );
}
