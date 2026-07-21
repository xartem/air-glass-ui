import { ChartLine, Contact, Filter, GitBranch, Grid3x3 } from "lucide-react";

import type { CrmDashboardPayload } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { t } from "@/lib/i18n";
import { formatCompactMoney } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { CategoryBars } from "@/components/charts/category-bars";
import { Funnel } from "@/components/charts/funnel";
import { Heatmap } from "@/components/charts/heatmap";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiTile, Leaderboard } from "./widgets";

/** Weekday column labels for the touch heatmap, Mon → Sun (reuses calendar keys). */
const WEEKDAY_KEYS = [1, 2, 3, 4, 5, 6, 0];

/*
 * CRM dashboard: sales/relationship overview for a period. KPI row + deals
 * funnel + pipeline by owner, then upcoming activities and a salespeople board.
 */

export function CrmDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="crm"
      icon={Contact}
      title={t("dash.crm.title")}
      subtitle={t("dash.crm.subtitle")}
    >
      {(data: CrmDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.crm.kpi.leads")}
              kpi={data.kpis.leads}
              format="count"
            />
            <KpiTile
              label={t("dash.crm.kpi.dealsWon")}
              kpi={data.kpis.dealsWon}
              format="count"
            />
            <KpiTile
              label={t("dash.crm.kpi.revenue")}
              kpi={data.kpis.revenue}
              format="money"
              currency={data.currency}
            />
            <KpiTile
              label={t("dash.crm.kpi.conversion")}
              kpi={data.kpis.conversion}
              format="percent"
            />
          </div>

          <Panel
            icon={ChartLine}
            title={t("dash.crm.trend.title")}
            description={t("dash.crm.trend.hint")}
          >
            {data.trend.length === 0 ? (
              <EmptyState title={t("table.empty.title")} />
            ) : (
              <TrendChart
                data={data.trend}
                seriesList={[
                  {
                    key: "value",
                    label: t("dash.crm.trend.title"),
                    color: "var(--chart-1)",
                  },
                ]}
                ariaLabel={t("dash.crm.trend.title")}
                formatValue={(value) =>
                  formatCompactMoney(value, data.currency, locale)
                }
              />
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              icon={Filter}
              title={t("dash.crm.funnel.title")}
              description={t("dash.crm.funnel.hint")}
            >
              {data.funnel.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Funnel
                  steps={data.funnel.map((step) => ({
                    label: t(`dash.crm.stage.${step.label}`),
                    value: step.value,
                  }))}
                />
              )}
            </Panel>
            <Panel
              icon={GitBranch}
              title={t("dash.crm.pipeline.title")}
              description={t("dash.crm.pipeline.hint")}
            >
              {data.pipeline.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.pipeline}
                  ariaLabel={t("dash.crm.pipeline.title")}
                  formatValue={(value) =>
                    formatCompactMoney(value, data.currency, locale)
                  }
                />
              )}
            </Panel>
          </div>

          <Panel
            icon={Grid3x3}
            title={t("dash.crm.touches.title")}
            description={t("dash.crm.touches.hint")}
          >
            <Heatmap
              xLabels={WEEKDAY_KEYS.map((day) => t(`calendar.weekday.${day}`))}
              yLabels={data.touches.channels.map((channel) => t(channel))}
              values={data.touches.values}
              ariaLabel={t("dash.crm.touches.title")}
            />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={t("dash.crm.activities.title")}
              description={t("dash.crm.activities.hint")}
            >
              {data.activities.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {data.activities.map((activity) => (
                    <li
                      key={activity.id}
                      className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {t(`dash.${activity.task}`)}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {activity.contact}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {new Date(activity.due).toLocaleDateString(locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel
              title={t("dash.crm.leaders.title")}
              description={t("dash.crm.leaders.hint")}
            >
              {data.leaders.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Leaderboard
                  rows={data.leaders}
                  format="compactMoney"
                  currency={data.currency}
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
