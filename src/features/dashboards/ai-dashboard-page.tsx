import {
  Bot,
  Coins,
  Grid3x3,
  TerminalSquare,
  TriangleAlert,
} from "lucide-react";

import type { AiDashboardPayload, AiFinding } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { t } from "@/lib/i18n";
import { formatCompactMoney, formatMoney, formatNumber } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { CategoryBars } from "@/components/charts/category-bars";
import { Donut } from "@/components/charts/donut";
import { Heatmap } from "@/components/charts/heatmap";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiTile, RankedList } from "./widgets";

/*
 * AI (LLM-ops) dashboard: usage & spend, conversations & tools, findings, and
 * performance for a period. Composed from the real ai module via the dashboards
 * mock; token-only styling, reuses the shared shell/widgets/charts.
 */

/** Weekday row labels for the requests heatmap, Mon → Sun (reuses calendar keys). */
const WEEKDAY_KEYS = [1, 2, 3, 4, 5, 6, 0];

/** Reuse the findings-panel colour mapping so the dashboard row matches the full page. */
const SEVERITY_BADGE: Record<AiFinding["severity"], StatusKind> = {
  critical: "error",
  error: "pending",
};
const STATUS_BADGE: Record<AiFinding["status"], StatusKind> = {
  new: "info",
  acknowledged: "pending",
  resolved: "success",
};

export function AiDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="ai"
      icon={Bot}
      title={t("dash.ai.title")}
      subtitle={t("dash.ai.subtitle")}
    >
      {(data: AiDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.ai.kpi.tokens")}
              kpi={data.kpis.tokens}
              format="count"
            />
            <KpiTile
              label={t("dash.ai.kpi.cost")}
              kpi={data.kpis.cost}
              format="money"
              currency={data.currency}
            />
            <KpiTile
              label={t("dash.ai.kpi.conversations")}
              kpi={data.kpis.conversations}
              format="count"
            />
            <KpiTile
              label={t("dash.ai.kpi.avgCost")}
              kpi={data.kpis.avgCost}
              format="money"
              currency={data.currency}
              invertDelta
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                icon={Coins}
                title={t("dash.ai.spend.title")}
                description={t("dash.ai.spend.hint")}
              >
                {data.spend.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <TrendChart
                    data={data.spend}
                    seriesList={[
                      {
                        key: "value",
                        label: t("dash.ai.spend.title"),
                        color: "var(--chart-1)",
                      },
                    ]}
                    ariaLabel={t("dash.ai.spend.title")}
                    formatValue={(value) =>
                      formatMoney(value, data.currency, locale)
                    }
                  />
                )}
              </Panel>
            </div>
            <Panel
              title={t("dash.ai.models.title")}
              description={t("dash.ai.models.hint")}
            >
              {data.modelSplit.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Donut
                  data={data.modelSplit}
                  ariaLabel={t("dash.ai.models.title")}
                  formatValue={(value) =>
                    formatCompactMoney(value, data.currency, locale)
                  }
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={t("dash.ai.conversations.title")}
              description={t("dash.ai.conversations.hint")}
            >
              {data.topConversations.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <RankedList
                  rows={data.topConversations}
                  format="money"
                  currency={data.currency}
                />
              )}
            </Panel>
            <Panel
              icon={TerminalSquare}
              title={t("dash.ai.tools.title")}
              description={t("dash.ai.tools.hint")}
            >
              {data.toolUsage.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.toolUsage}
                  ariaLabel={t("dash.ai.tools.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
          </div>

          <Panel
            icon={TriangleAlert}
            title={t("dash.ai.findings.title")}
            description={t("dash.ai.findings.hint")}
          >
            {data.findings.length === 0 ? (
              <EmptyState title={t("dash.ai.findings.empty")} />
            ) : (
              <ul className="divide-y divide-[var(--glass-border)]">
                {data.findings.map((finding) => (
                  <li
                    key={finding.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <StatusBadge
                      status={SEVERITY_BADGE[finding.severity]}
                      label={t(`ai.findings.severity.${finding.severity}`)}
                      className="shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {finding.title}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {finding.summary}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {t("ai.findings.count", { count: finding.count })}
                    </Badge>
                    <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:inline">
                      {new Date(finding.last_seen).toLocaleDateString(locale)}
                    </span>
                    <StatusBadge
                      status={STATUS_BADGE[finding.status]}
                      label={t(`ai.findings.status.${finding.status}`)}
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title={t("dash.ai.latency.title")}
              description={t("dash.ai.latency.hint")}
            >
              {data.performance.latency.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <TrendChart
                  data={data.performance.latency}
                  variant="line"
                  seriesList={[
                    {
                      key: "value",
                      label: t("dash.ai.latency.title"),
                      color: "var(--chart-2)",
                    },
                  ]}
                  ariaLabel={t("dash.ai.latency.title")}
                  formatValue={(value) =>
                    `${formatNumber(value, locale)} ${t("dash.ai.unit.ms")}`
                  }
                />
              )}
            </Panel>
            <Panel
              title={t("dash.ai.requests.title")}
              description={t("dash.ai.requests.hint")}
            >
              {data.performance.requests.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <TrendChart
                  data={data.performance.requests}
                  seriesList={[
                    {
                      key: "value",
                      label: t("dash.ai.requests.title"),
                      color: "var(--chart-3)",
                    },
                  ]}
                  ariaLabel={t("dash.ai.requests.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
          </div>

          <Panel
            icon={Grid3x3}
            title={t("dash.ai.heatmap.title")}
            description={t("dash.ai.heatmap.hint")}
          >
            <Heatmap
              xLabels={data.performance.heatmap.hours}
              yLabels={WEEKDAY_KEYS.map((day) => t(`calendar.weekday.${day}`))}
              values={data.performance.heatmap.values}
              ariaLabel={t("dash.ai.heatmap.title")}
              formatValue={(value) => formatNumber(value, locale)}
            />
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
