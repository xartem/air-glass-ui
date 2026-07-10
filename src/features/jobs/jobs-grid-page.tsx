import { useQuery } from "@tanstack/react-query";
import { Briefcase, LayoutGrid, MapPin, Rows3 } from "lucide-react";
import { useNavigate } from "react-router";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PaginationBar } from "@/components/pagination-bar";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

import { useJobsListFilters } from "./use-jobs-list";
import {
  GradientAvatar,
  JOB_DEPARTMENTS,
  JOB_STATUSES,
  JOB_STATUS_KIND,
  JOB_TYPES,
  formatSalaryRange,
} from "./jobs-shared";

/*
 * /jobs/grid — postings as a card grid sharing the exact `api.jobs.list` query
 * with the table view. Reachable with jobs.view.
 */

export function JobsGridPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const params = useListParams();
  const filters = useJobsListFilters(params);

  const listQuery = useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => api.jobs.list(filters),
    placeholderData: (previous) => previous,
  });

  const data = listQuery.data;
  const state = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : (data?.rows.length ?? 0) === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("jobs.list.title")}
        icon={Briefcase}
        primaryAction={{
          label: t("jobs.list.new"),
          href: "/jobs/new",
          permission: "jobs.manage",
        }}
      />

      <Panel
        icon={Briefcase}
        title={t("jobs.list.title")}
        description={t("jobs.list.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("jobs.list.search")}
              className="w-52"
            />
            <Select
              value={filters.department ?? "all"}
              onValueChange={(value) =>
                params.setFilter(
                  "department",
                  value === "all" ? undefined : value,
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("jobs.list.filter.department")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobs.list.filter.all")}</SelectItem>
                {JOB_DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {t(`jobs.dept.${department}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.type ?? "all"}
              onValueChange={(value) =>
                params.setFilter("type", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("jobs.list.filter.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobs.list.filter.all")}</SelectItem>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`jobs.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t("jobs.list.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobs.list.filter.all")}</SelectItem>
                {JOB_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`jobs.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("jobs.list.view.table")}
                onClick={() => navigate("/jobs/list")}
              >
                <Rows3 />
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label={t("jobs.list.view.grid")}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        }
        contentClassName="p-4"
      >
        {state === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : state === "error" ? (
          <EmptyState
            icon={Briefcase}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void listQuery.refetch(),
            }}
          />
        ) : state === "empty" ? (
          <EmptyState
            icon={Briefcase}
            title={t("jobs.list.empty")}
            description={t("jobs.list.empty_hint")}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.rows.map((job) => (
                <div
                  key={job.id}
                  className="glass-card flex flex-col gap-3 rounded-2xl p-4"
                >
                  <div className="flex items-start gap-3">
                    <GradientAvatar
                      gradient={job.gradient}
                      name={job.company}
                      className="size-11 rounded-2xl text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{job.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {job.company}
                      </div>
                    </div>
                    <StatusBadge
                      status={JOB_STATUS_KIND[job.status]}
                      label={t(`jobs.status.${job.status}`)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {job.location}
                    </span>
                    <Badge variant="outline">
                      {t(`jobs.type.${job.type}`)}
                    </Badge>
                  </div>
                  <div className="text-sm font-medium tabular-nums">
                    {formatSalaryRange(
                      job.salary_min,
                      job.salary_max,
                      job.currency,
                      locale,
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate("/jobs/application")}
                    >
                      {t("jobs.list.apply")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      {t("common.view")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {data ? (
              <PaginationBar
                pagination={{
                  page: data.page,
                  perPage: data.per_page,
                  total: data.total,
                  pages: Math.max(1, Math.ceil(data.total / data.per_page)),
                }}
                shown={data.rows.length}
                onPage={(page) => params.setPage(page)}
              />
            ) : null}
          </div>
        )}
      </Panel>
    </div>
  );
}
