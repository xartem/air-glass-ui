import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { OhlcPoint } from "@/api";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

/*
 * Candlestick (crypto OHLC). Recharts has no native candlestick, so we compose
 * it from a floating Bar (each bar's pixel box spans [low, high]) plus a custom
 * shape that draws the wick and the open/close body. Up/down colours come from
 * the --status-* tokens. Shared: also reusable by the charts showcase.
 */

const CONFIG: ChartConfig = { candle: { label: "", color: "var(--chart-1)" } };

interface CandleShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: OhlcPoint;
}

/** The Bar box spans [low, high]; linearly map any price inside it to a pixel. */
function Candle({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  payload,
}: CandleShapeProps) {
  if (!payload) return null;
  const { open, high, low, close } = payload;
  const span = high - low || 1;
  const pixel = (value: number) => y + ((high - value) / span) * height;
  const up = close >= open;
  const color = up ? "var(--status-success-fg)" : "var(--status-error-fg)";
  const cx = x + width / 2;
  const bodyTop = pixel(Math.max(open, close));
  const bodyBottom = pixel(Math.min(open, close));
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  const bodyWidth = Math.max(2, width * 0.6);
  return (
    <g>
      <line
        x1={cx}
        x2={cx}
        y1={pixel(high)}
        y2={pixel(low)}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={cx - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        rx={1}
        fill={color}
      />
    </g>
  );
}

function OhlcTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ payload: OhlcPoint }>;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]!.payload;
  const rows: Array<[string, number]> = [
    ["O", point.open],
    ["H", point.high],
    ["L", point.low],
    ["C", point.close],
  ];
  return (
    <div className="rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <div className="mb-1 font-medium">{point.label}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 tabular-nums">
        {rows.map(([key, value]) => (
          <span key={key} className="flex justify-between gap-2">
            <span className="text-muted-foreground">{key}</span>
            {formatValue(value)}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Candlestick({
  data,
  ariaLabel,
  formatValue,
}: {
  data: readonly OhlcPoint[];
  ariaLabel: string;
  formatValue: (value: number) => string;
}) {
  const rows = data.map((point) => ({
    ...point,
    candle: [point.low, point.high] as [number, number],
  }));
  const lows = data.map((point) => point.low);
  const highs = data.map((point) => point.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.05 || 1;

  return (
    <ChartContainer
      config={CONFIG}
      ariaLabel={ariaLabel}
      className="aspect-auto h-[260px] w-full"
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
          minTickGap={24}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
        />
        <YAxis domain={[min - pad, max + pad]} hide />
        <ChartTooltip content={<OhlcTooltip formatValue={formatValue} />} />
        <Bar dataKey="candle" shape={<Candle />} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}
