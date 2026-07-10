import { Treemap } from "recharts";

import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

/*
 * Market-cap treemap (crypto). Recharts Treemap with a custom content node that
 * fills each tile from a --chart-* token and prints the label + share when the
 * tile is large enough. Shared: also usable by the charts showcase.
 */

const CONFIG: ChartConfig = { value: { label: "", color: "var(--chart-1)" } };

interface TileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
  total?: number;
}

function Tile({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  name,
  value = 0,
  total = 1,
}: TileProps) {
  const share = Math.round((value / total) * 100);
  const showText = width > 64 && height > 36;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={`var(--chart-${(index % 5) + 1})`}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {showText ? (
        <>
          <text
            x={x + 8}
            y={y + 20}
            fill="var(--background)"
            fontSize={12}
            fontWeight={600}
          >
            {name}
          </text>
          <text
            x={x + 8}
            y={y + 36}
            fill="var(--background)"
            fontSize={11}
            opacity={0.85}
          >
            {share}%
          </text>
        </>
      ) : null}
    </g>
  );
}

export function MarketTreemap({
  data,
  ariaLabel,
}: {
  data: ReadonlyArray<{ label: string; value: number }>;
  ariaLabel: string;
}) {
  const total = Math.max(
    1,
    data.reduce((sum, row) => sum + row.value, 0),
  );
  const nodes = data.map((row) => ({ name: row.label, value: row.value }));
  return (
    <ChartContainer
      config={CONFIG}
      ariaLabel={ariaLabel}
      className="aspect-auto h-[260px] w-full"
    >
      <Treemap
        data={nodes}
        dataKey="value"
        nameKey="name"
        stroke="var(--background)"
        content={<Tile total={total} />}
        isAnimationActive={false}
      />
    </ChartContainer>
  );
}
