import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Box-and-whisker plot. Recharts has no native boxplot, so — like the
 * candlestick — we compose it from a floating Bar (each bar's pixel box spans
 * [min, max]) plus a custom shape that draws the whiskers, the Q1–Q3 box and
 * the median line. Colours come only from the --chart-* tokens (single hue, or
 * cycled per category when multiColor). Static composition, reusable by the
 * charts showcase.
 */

export interface BoxPlotDatum {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

const CONFIG: ChartConfig = { box: { label: "", color: "var(--chart-1)" } };

interface BoxShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  multiColor?: boolean;
  payload?: BoxPlotDatum;
}

/** The Bar box spans [min, max]; linearly map any stat inside it to a pixel. */
function Box({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  multiColor = false,
  payload,
}: BoxShapeProps) {
  if (!payload) return null;
  const { min, q1, median, q3, max } = payload;
  const span = max - min || 1;
  const pixel = (value: number) => y + ((max - value) / span) * height;
  const color = multiColor
    ? `var(--chart-${(index % 5) + 1})`
    : "var(--chart-1)";
  const cx = x + width / 2;
  const boxWidth = Math.max(4, width * 0.55);
  const capWidth = Math.max(6, width * 0.32);
  const boxTop = pixel(q3);
  const boxHeight = Math.max(1, pixel(q1) - boxTop);
  return (
    <g>
      <line
        x1={cx}
        x2={cx}
        y1={pixel(max)}
        y2={pixel(min)}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.7}
      />
      <line
        x1={cx - capWidth / 2}
        x2={cx + capWidth / 2}
        y1={pixel(max)}
        y2={pixel(max)}
        stroke={color}
        strokeWidth={1}
      />
      <line
        x1={cx - capWidth / 2}
        x2={cx + capWidth / 2}
        y1={pixel(min)}
        y2={pixel(min)}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={cx - boxWidth / 2}
        y={boxTop}
        width={boxWidth}
        height={boxHeight}
        rx={2}
        fill={color}
        fillOpacity={0.22}
        stroke={color}
        strokeWidth={1.5}
      />
      <line
        x1={cx - boxWidth / 2}
        x2={cx + boxWidth / 2}
        y1={pixel(median)}
        y2={pixel(median)}
        stroke={color}
        strokeWidth={2}
      />
    </g>
  );
}

function BoxTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ payload: BoxPlotDatum }>;
  formatValue?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  const fmt = (value: number) => (formatValue ? formatValue(value) : `${value}`);
  const rows: Array<[string, number]> = [
    ["Max", point.max],
    ["Q3", point.q3],
    ["Median", point.median],
    ["Q1", point.q1],
    ["Min", point.min],
  ];
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-medium">{point.label}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
        {rows.map(([key, value]) => (
          <span key={key} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{key}</span>
            {fmt(value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BoxPlot({
  data,
  ariaLabel,
  formatValue,
  multiColor = true,
  height = 260,
}: {
  data: readonly BoxPlotDatum[];
  ariaLabel: string;
  formatValue?: (value: number) => string;
  multiColor?: boolean;
  height?: number;
}) {
  const rows = data.map((point) => ({
    ...point,
    box: [point.min, point.max] as [number, number],
  }));
  const min = Math.min(...data.map((point) => point.min));
  const max = Math.max(...data.map((point) => point.max));
  const pad = (max - min) * 0.1 || 1;

  return (
    <ChartContainer
      config={CONFIG}
      ariaLabel={ariaLabel}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
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
        <YAxis domain={[min - pad, max + pad]} hide />
        <ChartTooltip content={<BoxTooltip formatValue={formatValue} />} />
        <Bar
          dataKey="box"
          shape={<Box multiColor={multiColor} />}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
}
