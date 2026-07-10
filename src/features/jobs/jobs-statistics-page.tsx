import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, Filter, TrendingUp, Users } from "lucide-react";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBars } from "@/features/dashboards/charts/category-bars";
import { Funnel } from "@/features/dashboards/charts/funnel";
import { TrendChart } from "@/features/dashboards/charts/trend-chart";
import { formatNumber } from "@/lib/money";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { CANDIDATE_STAGE_KIND, initials } from "./jobs-shared";

/*
 * /jobs/statistics — recruitment dashboard: KPI row, applications trend, hiring
 * by department, the candidate pipeline funnel and recent applicants. Reachable
 * with jobs.view.
 */

export function JobsStatisticsPage() {
  const locale = useLocale();
  const dt = useSiteDateTime();

  console.debug("[JobsStatistics] query");
  const statsQuery = useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: api.jobs.stats,
  });

  const data = statsQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t("jobs.stats.title")} icon={Briefcase} />

      {statsQuery.isError ? (
        <Panel>
          <EmptyState
            icon={Briefcase}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void statsQuery.refetch(),
            }}
          />
        </Panel>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("jobs.stats.kpi.openRoles")}
              value={
                data
                  ? formatNumber(data.kpis.openRoles.value, locale)
                  : undefined
              }
              delta={data?.kpis.openRoles.delta}
            />
            <KpiTile
              label={t("jobs.stats.kpi.applicants")}
              value={
                data
                  ? formatNumber(data.kpis.applicants.value, locale)
                  : undefined
              }
              delta={data?.kpis.applicants.delta}
            />
            <KpiTile
              label={t("jobs.stats.kpi.interviews")}
              value={
                data
                  ? formatNumber(data.kpis.interviews.value, locale)
                  : undefined
              }
              delta={data?.kpis.interviews.delta}
            />
            <KpiTile
              label={t("jobs.stats.kpi.hires")}
              value={
                data ? formatNumber(data.kpis.hires.value, locale) : undefined
              }
              delta={data?.kpis.hires.delta}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                icon={TrendingUp}
                title={t("jobs.stats.applications.title")}
                description={t("jobs.stats.applications.hint")}
              >
                {!data ? (
                  <Skeleton className="h-64 rounded-xl" />
                ) : data.applications.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <TrendChart
                    data={data.applications}
                    variant="line"
                    seriesList={[
                      {
                        key: "value",
                        label: t("jobs.stats.applications.title"),
                        color: "var(--chart-1)",
                      },
                    ]}
                    ariaLabel={t("jobs.stats.applications.title")}
                    formatValue={(value) => formatNumber(value, locale)}
                  />
                )}
              </Panel>
            </div>
            <Panel
              icon={Building2}
              title={t("jobs.stats.departments.title")}
              description={t("jobs.stats.departments.hint")}
            >
              {!data ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : data.departments.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.departments.map((row) => ({
                    label: t(`jobs.dept.${row.label}`),
                    value: row.value,
                  }))}
                  ariaLabel={t("jobs.stats.departments.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              icon={Filter}
              title={t("jobs.stats.pipeline.title")}
              description={t("jobs.stats.pipeline.hint")}
            >
              {!data ? (
                <Skeleton className="h-48 rounded-xl" />
              ) : data.pipeline.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Funnel
                  steps={data.pipeline.map((step) => ({
                    label: t(`jobs.stage.${step.label}`),
                    value: step.value,
                  }))}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
            <Panel
              icon={Users}
              title={t("jobs.stats.recent.title")}
              description={t("jobs.stats.recent.hint")}
            >
              {!data ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : data.recent.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {data.recent.map((applicant) => (
                    <li
                      key={applicant.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <Avatar size="sm">
                        <AvatarFallback>
                          {initials(applicant.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {applicant.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {applicant.role}
                        </div>
                      </div>
                      <div className="hidden text-xs text-muted-foreground sm:block">
                        {dt.format(applicant.applied_at)}
                      </div>
                      <StatusBadge
                        status={CANDIDATE_STAGE_KIND[applicant.stage]}
                        label={t(`jobs.stage.${applicant.stage}`)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function KpiTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | undefined;
  delta: number | undefined;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      {value === undefined ? (
        <Skeleton className="mt-2 h-8 w-20 rounded-md" />
      ) : (
        <div className="mt-1 flex items-baseline gap-2">
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
          {delta !== undefined ? (
            <span
              className="text-xs font-medium tabular-nums"
              style={{
                color: up
                  ? "var(--status-success-fg)"
                  : "var(--status-error-fg)",
              }}
            >
              {up ? "+" : ""}
              {(delta * 100).toFixed(1)}%
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
