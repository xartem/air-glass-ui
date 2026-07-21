import { Briefcase, Building2, Filter, TrendingUp, Wallet } from "lucide-react";

import type { JobApplicantStage, JobsDashboardPayload } from "@/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { t } from "@/lib/i18n";
import { formatCompactMoney, formatNumber } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { BoxPlot } from "@/components/charts/boxplot";
import { CategoryBars } from "@/components/charts/category-bars";
import { Funnel } from "@/components/charts/funnel";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiTile } from "./widgets";

/** Salaries are shown as annual USD ranges (jobs payload has no per-row currency). */
const SALARY_CURRENCY = "USD";

/*
 * Jobs dashboard: recruitment funnel health for a period. KPI row + applications
 * trend + by-department bars, then the candidate pipeline and recent applicants.
 */

const STAGE_KIND: Record<JobApplicantStage, StatusKind> = {
  applied: "pending",
  screening: "info",
  interview: "info",
  offer: "draft",
  hired: "success",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function JobsDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="jobs"
      icon={Briefcase}
      title={t("dash.jobs.title")}
      subtitle={t("dash.jobs.subtitle")}
    >
      {(data: JobsDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.jobs.kpi.openRoles")}
              kpi={data.kpis.openRoles}
              format="count"
            />
            <KpiTile
              label={t("dash.jobs.kpi.applicants")}
              kpi={data.kpis.applicants}
              format="count"
            />
            <KpiTile
              label={t("dash.jobs.kpi.hires")}
              kpi={data.kpis.hires}
              format="count"
            />
            <KpiTile
              label={t("dash.jobs.kpi.timeToFill")}
              kpi={data.kpis.timeToFill}
              format="count"
              unit={t("dash.jobs.unit.days")}
              invertDelta
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                icon={TrendingUp}
                title={t("dash.jobs.applications.title")}
                description={t("dash.jobs.applications.hint")}
              >
                {data.applications.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <TrendChart
                    data={data.applications}
                    variant="line"
                    seriesList={[
                      {
                        key: "value",
                        label: t("dash.jobs.applications.title"),
                        color: "var(--chart-1)",
                      },
                    ]}
                    ariaLabel={t("dash.jobs.applications.title")}
                    formatValue={(value) => formatNumber(value, locale)}
                  />
                )}
              </Panel>
            </div>
            <Panel
              icon={Building2}
              title={t("dash.jobs.departments.title")}
              description={t("dash.jobs.departments.hint")}
            >
              {data.departments.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.departments.map((row) => ({
                    label: t(`dash.jobs.dept.${row.label}`),
                    value: row.value,
                  }))}
                  ariaLabel={t("dash.jobs.departments.title")}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              icon={Filter}
              title={t("dash.jobs.pipeline.title")}
              description={t("dash.jobs.pipeline.hint")}
            >
              {data.pipeline.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Funnel
                  steps={data.pipeline.map((step) => ({
                    label: t(`dash.jobs.stage.${step.label}`),
                    value: step.value,
                  }))}
                  formatValue={(value) => formatNumber(value, locale)}
                />
              )}
            </Panel>
            <Panel
              title={t("dash.jobs.applicants.title")}
              description={t("dash.jobs.applicants.hint")}
            >
              {data.applicants.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {data.applicants.map((applicant) => (
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
                          {t(`dash.${applicant.role}`)}
                        </div>
                      </div>
                      <StatusBadge
                        status={STAGE_KIND[applicant.stage]}
                        label={t(`dash.jobs.stage.${applicant.stage}`)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <Panel
            icon={Wallet}
            title={t("dash.jobs.salaries.title")}
            description={t("dash.jobs.salaries.hint")}
          >
            {data.salaries.length === 0 ? (
              <EmptyState title={t("table.empty.title")} />
            ) : (
              <BoxPlot
                data={data.salaries.map((row) => ({
                  ...row,
                  label: t(`dash.jobs.dept.${row.label}`),
                }))}
                ariaLabel={t("dash.jobs.salaries.title")}
                formatValue={(value) =>
                  formatCompactMoney(value, SALARY_CURRENCY, locale)
                }
              />
            )}
          </Panel>
        </>
      )}
    </DashboardShell>
  );
}
