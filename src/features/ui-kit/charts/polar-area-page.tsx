import { Pie, PieChart } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Polar area (Nightingale rose) showcase (W5): equal-angle sectors whose RADIUS
 * encodes the value — built from N single-datum Recharts Pie sectors so each can
 * own its outerRadius. Colors come only from the --chart-* palette.
 */

const WEEKDAYS = [
  { label: "Mon", value: 32 },
  { label: "Tue", value: 48 },
  { label: "Wed", value: 61 },
  { label: "Thu", value: 55 },
  { label: "Fri", value: 74 },
  { label: "Sat", value: 40 },
  { label: "Sun", value: 22 },
];

const CHANNELS = [
  { label: "Search", value: 68 },
  { label: "Social", value: 52 },
  { label: "Email", value: 44 },
  { label: "Direct", value: 61 },
  { label: "Display", value: 30 },
];

const MAX_RADIUS = 108;

function RosePreview({
  data,
  ariaLabel,
}: {
  data: ReadonlyArray<{ label: string; value: number }>;
  ariaLabel: string;
}) {
  const max = Math.max(1, ...data.map((row) => row.value));
  const slice = 360 / data.length;
  const config: ChartConfig = Object.fromEntries(
    data.map((row, index) => [
      row.label,
      { label: row.label, color: `var(--chart-${(index % 5) + 1})` },
    ]),
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ChartContainer
        config={config}
        ariaLabel={ariaLabel}
        className="aspect-square h-[240px]"
      >
        <PieChart>
          {data.map((row, index) => {
            const start = 90 - index * slice;
            const end = start - slice;
            const outer = 28 + (row.value / max) * (MAX_RADIUS - 28);
            return (
              <Pie
                key={row.label}
                data={[{ value: 1 }]}
                dataKey="value"
                startAngle={start}
                endAngle={end}
                innerRadius={0}
                outerRadius={outer}
                fill={`var(--chart-${(index % 5) + 1})`}
                fillOpacity={0.85}
                stroke="var(--background)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            );
          })}
        </PieChart>
      </ChartContainer>
      <ul className="flex min-w-0 flex-1 flex-col gap-2">
        {data.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: `var(--chart-${(index % 5) + 1})` }}
            />
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartsPolarAreaPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.polarArea.title")}
      description={t("showcase.charts.polarArea.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.rose")}
        notes={t("showcase.charts.polarArea.note")}
        previewClassName="block"
        code={`{data.map((row, i) => (
  <Pie
    key={row.label}
    data={[{ value: 1 }]}
    dataKey="value"
    startAngle={90 - i * slice}
    endAngle={90 - (i + 1) * slice}
    outerRadius={scaleRadius(row.value)}
    fill={\`var(--chart-\${(i % 5) + 1})\`}
  />
))}`}
      >
        <RosePreview
          data={WEEKDAYS}
          ariaLabel={t("showcase.charts.polarArea.title")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.channels")}
        previewClassName="block"
        code={`<RosePreview data={channels} ariaLabel="Channels" />`}
      >
        <RosePreview
          data={CHANNELS}
          ariaLabel={t("showcase.charts.s.channels")}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
