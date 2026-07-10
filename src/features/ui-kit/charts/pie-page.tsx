import { Cell, Pie, PieChart } from "recharts";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Donut } from "@/components/charts/donut";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Pie chart showcase (W5): a filled Recharts Pie plus the shared Donut
 * composition. Slice colors cycle the --chart-* palette; no hardcoded hex.
 */

const TRAFFIC = [
  { label: "Direct", value: 42 },
  { label: "Organic", value: 28 },
  { label: "Referral", value: 16 },
  { label: "Social", value: 9 },
  { label: "Email", value: 5 },
];

const STATUS = [
  { label: "Completed", value: 58 },
  { label: "In progress", value: 24 },
  { label: "Blocked", value: 10 },
  { label: "Backlog", value: 34 },
];

const pieConfig: ChartConfig = Object.fromEntries(
  TRAFFIC.map((row, index) => [
    row.label,
    { label: row.label, color: `var(--chart-${(index % 5) + 1})` },
  ]),
);

export function ChartsPiePage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.pie.title")}
      description={t("showcase.charts.pie.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.pie")}
        previewClassName="block"
        code={`<PieChart>
  <Pie data={data} dataKey="value" nameKey="label" outerRadius={90}>
    {data.map((_, i) => (
      <Cell key={i} fill={\`var(--chart-\${(i % 5) + 1})\`} />
    ))}
  </Pie>
</PieChart>`}
      >
        <ChartContainer
          config={pieConfig}
          ariaLabel={t("showcase.charts.pie.title")}
          className="aspect-square h-[240px]"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={TRAFFIC}
              dataKey="value"
              nameKey="label"
              outerRadius={92}
              strokeWidth={0}
            >
              {TRAFFIC.map((_, index) => (
                <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.donut")}
        notes={t("showcase.charts.pie.donutNote")}
        previewClassName="block"
        code={`<Donut
  data={status}
  ariaLabel="Task status"
  formatValue={(v) => \`\${v} tasks\`}
/>`}
      >
        <Donut
          data={STATUS}
          ariaLabel={t("showcase.charts.s.donut")}
          formatValue={(value) => `${value}`}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
