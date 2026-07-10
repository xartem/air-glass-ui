import { CircleAlert } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import { WidgetGrid, WIDGET_SPAN } from "@/components/widget-grid";
import {
  ChartCard,
  ListCard,
  StatCard,
  StatusCard,
  WidgetCardFrame,
} from "@/components/widget-cards";
import { WidgetSkeleton } from "@/features/dashboard/dashboard-widget-card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Widgets showcase (W5): the four dashboard widget archetypes (StatCard /
 * ChartCard / ListCard / StatusCard) laid out on the shared WidgetGrid, then
 * the size-tier ladder and the loading / error / empty contract. Data below is
 * LOCAL static demo content — screens feed these cards from their module payload.
 */

const WIDGET_DEMO_X = [
  "21.06",
  "22.06",
  "23.06",
  "24.06",
  "25.06",
  "26.06",
  "27.06",
  "28.06",
  "29.06",
  "30.06",
  "01.07",
  "02.07",
  "03.07",
  "04.07",
];

const WIDGET_DEMO_CHART = {
  kind: "bar" as const,
  series: [
    {
      label_key: "uikit.widget.orders_chart",
      points: [6, 9, 7, 12, 10, 14, 11, 16, 13, 18, 15, 20, 17, 22].map(
        (y, index) => ({ x: WIDGET_DEMO_X[index]!, y }),
      ),
    },
    {
      label_key: "uikit.widget.leads",
      points: [3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 11, 9, 12].map((y, index) => ({
        x: WIDGET_DEMO_X[index]!,
        y,
      })),
    },
  ],
};

const WIDGET_DEMO_STAT = {
  value: 148,
  delta: 12,
  series: [90, 110, 104, 126, 131, 139, 143, 148],
};

const WIDGET_DEMO_LIST = {
  items: [
    { title: '#432 — "Need a pump for the cottage"', hint: "12:40", badge: "new" },
    { title: '#431 — "Call me back about roofing"', hint: "11:05", badge: "new" },
    { title: '#430 — "How much is installation?"', hint: "09:32" },
    { title: '#429 — "Is the GNOM-40 in stock?"', hint: "yesterday" },
    { title: '#428 — "Need an invoice for a company"', hint: "yesterday" },
    { title: '#427 — "Do you deliver to Denver?"', hint: "2 days ago" },
  ],
};

const WIDGET_DEMO_STATUS = {
  rows: [
    { label_key: "scheduler.widget.pending", value: "3", state: "ok" as const },
    { label_key: "scheduler.widget.failed", value: "2", state: "warn" as const },
    {
      label_key: "scheduler.widget.last_tick",
      value: "2h ago",
      state: "error" as const,
    },
  ],
};

export function WidgetsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.widgets.title")}
      description={t("showcase.widgets.desc")}
      breadcrumb={{ group: t("nav.components.widgets") }}
    >
      <ComponentDemo
        title={t("showcase.widgets.archetypes")}
        description={t("showcase.widgets.archetypes_desc")}
        previewClassName="block"
        code={`<WidgetGrid>
  <StatCard title="Pages" icon="file-text" size="sm" data={{ value: 12 }} className={WIDGET_SPAN.sm} />
  <ChartCard title="Orders" icon="chart-column" size="sm" data={chart} className={WIDGET_SPAN.sm} />
  <ListCard title="Leads" icon="inbox" size="sm" data={list} className={WIDGET_SPAN.sm} />
  <StatusCard title="Queue" icon="timer" size="sm" data={status} className={WIDGET_SPAN.sm} />
</WidgetGrid>`}
      >
        <WidgetGrid>
          <StatCard
            title={t("uikit.widget.pages")}
            icon="file-text"
            size="sm"
            data={{ value: 12 }}
            className={WIDGET_SPAN.sm}
          />
          <ChartCard
            title={t("uikit.widget.orders_chart")}
            icon="chart-column"
            size="sm"
            data={WIDGET_DEMO_CHART}
            className={WIDGET_SPAN.sm}
          />
          <ListCard
            title={t("uikit.widget.leads")}
            icon="inbox"
            size="sm"
            data={WIDGET_DEMO_LIST}
            className={WIDGET_SPAN.sm}
          />
          <StatusCard
            title={t("uikit.widget.queue")}
            icon="timer"
            size="sm"
            data={WIDGET_DEMO_STATUS}
            className={WIDGET_SPAN.sm}
          />
        </WidgetGrid>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.widgets.sizes")}
        notes={t("showcase.widgets.sizes_note")}
        previewClassName="block"
        code={`<StatCard size="sm" className={WIDGET_SPAN.sm} data={stat} />
<StatCard size="md" className={WIDGET_SPAN.md} data={stat} />
<StatCard size="lg" className={WIDGET_SPAN.lg} data={stat} />
<StatCard size="xl" className={WIDGET_SPAN.xl} data={stat} />`}
      >
        <WidgetGrid>
          <StatCard
            title={t("uikit.widget.products")}
            icon="shopping-cart"
            size="sm"
            data={WIDGET_DEMO_STAT}
            className={WIDGET_SPAN.sm}
          />
          <StatCard
            title={t("uikit.widget.products")}
            icon="shopping-cart"
            size="md"
            data={WIDGET_DEMO_STAT}
            className={WIDGET_SPAN.md}
          />
          <StatCard
            title={t("uikit.widget.products")}
            icon="shopping-cart"
            size="lg"
            data={WIDGET_DEMO_STAT}
            className={WIDGET_SPAN.lg}
          />
          <StatCard
            title={t("uikit.widget.products")}
            icon="shopping-cart"
            size="xl"
            data={WIDGET_DEMO_STAT}
            className={WIDGET_SPAN.xl}
          />
        </WidgetGrid>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.widgets.charts")}
        previewClassName="block"
        code={`<ChartCard size="md" className={WIDGET_SPAN.md} data={chart} />
<ChartCard size="lg" className={WIDGET_SPAN.lg} data={chart} />
<ListCard size="md" className={WIDGET_SPAN.md} data={list} />
<StatusCard size="md" className={WIDGET_SPAN.md} data={status} />`}
      >
        <WidgetGrid>
          <ChartCard
            title={t("uikit.widget.orders_chart")}
            icon="chart-column"
            size="md"
            data={WIDGET_DEMO_CHART}
            className={WIDGET_SPAN.md}
          />
          <ChartCard
            title={t("uikit.widget.orders_chart")}
            icon="chart-column"
            size="lg"
            data={WIDGET_DEMO_CHART}
            className={WIDGET_SPAN.lg}
          />
          <ListCard
            title={t("uikit.widget.leads")}
            icon="inbox"
            size="md"
            data={WIDGET_DEMO_LIST}
            className={WIDGET_SPAN.md}
          />
          <StatusCard
            title={t("uikit.widget.queue")}
            icon="timer"
            size="md"
            data={WIDGET_DEMO_STATUS}
            className={WIDGET_SPAN.md}
          />
        </WidgetGrid>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.widgets.states")}
        notes={t("showcase.widgets.states_note")}
        previewClassName="block"
        code={`<WidgetCardFrame title="Pages" icon="file-text">
  <WidgetSkeleton type="stat" size="sm" />
</WidgetCardFrame>
<ListCard title="Leads" icon="inbox" size="sm" data={{ items: [] }} />`}
      >
        <WidgetGrid>
          <WidgetCardFrame
            title={t("uikit.widget.pages")}
            icon="file-text"
            className={WIDGET_SPAN.sm}
          >
            <WidgetSkeleton type="stat" size="sm" />
          </WidgetCardFrame>
          <WidgetCardFrame
            title={t("uikit.widget.orders_chart")}
            icon="chart-column"
            className={WIDGET_SPAN.sm}
          >
            <WidgetSkeleton type="chart" size="sm" />
          </WidgetCardFrame>
          <WidgetCardFrame
            title={t("uikit.widget.leads")}
            icon="inbox"
            className={WIDGET_SPAN.sm}
          >
            <div className="flex flex-col items-start gap-2">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CircleAlert className="size-4 shrink-0 text-destructive" />
                {t("dashboard.widget_error")}
              </p>
              <Button variant="outline" size="sm">
                {t("common.retry")}
              </Button>
            </div>
          </WidgetCardFrame>
          <ListCard
            title={t("uikit.widget.leads")}
            icon="inbox"
            size="sm"
            data={{ items: [] }}
            className={WIDGET_SPAN.sm}
          />
        </WidgetGrid>
      </ComponentDemo>
    </ShowcasePage>
  );
}
