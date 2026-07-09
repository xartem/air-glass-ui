import { FolderKanban, ListChecks, TrendingDown, Users } from "lucide-react";

import type { ProjectsDashboardPayload } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { CategoryBars } from "./charts/category-bars";
import { Donut } from "./charts/donut";
import { TrendChart } from "./charts/trend-chart";
import { KpiTile } from "./widgets";

/*
 * Projects dashboard: delivery health for a period. KPI row + burndown line +
 * tasks-by-status donut, then project progress, team workload and an activity feed.
 */

export function ProjectsDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="projects"
      icon={FolderKanban}
      title={t("dash.projects.title")}
      subtitle={t("dash.projects.subtitle")}
    >
      {(data: ProjectsDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.projects.kpi.active")}
              kpi={data.kpis.active}
              format="count"
            />
            <KpiTile
              label={t("dash.projects.kpi.completed")}
              kpi={data.kpis.completed}
              format="count"
            />
            <KpiTile
              label={t("dash.projects.kpi.overdue")}
              kpi={data.kpis.overdue}
              format="count"
              invertDelta
            />
            <KpiTile
              label={t("dash.projects.kpi.teamLoad")}
              kpi={data.kpis.teamLoad}
              format="percent"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                icon={TrendingDown}
                title={t("dash.projects.burndown.title")}
                description={t("dash.projects.burndown.hint")}
              >
                {data.burndown.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <TrendChart
                    data={data.burndown}
                    variant="line"
                    seriesList={[
                      {
                        key: "remaining",
                        label: t("dash.projects.burndown.remaining"),
                        color: "var(--chart-1)",
                      },
                      {
                        key: "ideal",
                        label: t("dash.projects.burndown.ideal"),
                        color: "var(--chart-3)",
                      },
                    ]}
                    ariaLabel={t("dash.projects.burndown.title")}
                    formatValue={(value) => formatNumber(value, locale)}
                  />
                )}
              </Panel>
            </div>
            <Panel
              icon={ListChecks}
              title={t("dash.projects.status.title")}
              description={t("dash.projects.status.hint")}
            >
              {data.statusSplit.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Donut
                  data={data.statusSplit.map((row) => ({
                    label: t(`dash.projects.status.${row.label}`),
                    value: row.value,
                  }))}
                  ariaLabel={t("dash.projects.status.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                title={t("dash.projects.progress.title")}
                description={t("dash.projects.progress.hint")}
              >
                {data.projects.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <ul className="space-y-3.5">
                    {data.projects.map((project) => (
                      <li key={project.id}>
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate font-medium">
                            {project.name}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {new Date(project.deadline).toLocaleDateString(
                              locale,
                            )}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-[width] duration-500"
                              style={{
                                width: `${Math.round(project.progress * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="w-9 shrink-0 text-end text-xs tabular-nums">
                            {Math.round(project.progress * 100)}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
            <Panel
              icon={Users}
              title={t("dash.projects.workload.title")}
              description={t("dash.projects.workload.hint")}
            >
              {data.workload.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.workload}
                  ariaLabel={t("dash.projects.workload.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                  height={220}
                />
              )}
            </Panel>
          </div>

          <Panel
            title={t("dash.projects.activity.title")}
            description={t("dash.projects.activity.hint")}
          >
            {data.activity.length === 0 ? (
              <EmptyState title={t("table.empty.title")} />
            ) : (
              <Timeline>
                {data.activity.map((event) => (
                  <TimelineItem key={event.id}>
                    <TimelineIndicator
                      variant={
                        event.kind === "warning" ? "warning" : event.kind
                      }
                    />
                    <TimelineConnector />
                    <TimelineContent>
                      <TimelineTitle>
                        {t(`dash.${event.title}`)} ·{" "}
                        <span className="text-muted-foreground">
                          {event.meta}
                        </span>
                      </TimelineTitle>
                      <TimelineTime>
                        {new Date(event.at).toLocaleString(locale)}
                      </TimelineTime>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            )}
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
