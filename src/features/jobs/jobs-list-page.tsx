import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, LayoutGrid, MapPin, Rows3 } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type Job } from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";

import { useJobsListFilters } from "./use-jobs-list";
import {
  JOB_DEPARTMENTS,
  JOB_STATUSES,
  JOB_STATUS_KIND,
  JOB_TYPES,
} from "./jobs-shared";

/*
 * /jobs/list — postings as a filterable, paginated table with a "New job" CTA
 * and a toggle to the shared card grid. Reachable with jobs.view.
 */

export function JobsListPage() {
  const dt = useSiteDateTime();
  const navigate = useNavigate();
  const params = useListParams();
  const filters = useJobsListFilters(params);

  const listQuery = useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => api.jobs.list(filters),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<Job>[]>(
    () => [
      {
        id: "title",
        header: t("jobs.list.col.title"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.title}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.company}
            </div>
          </div>
        ),
      },
      {
        id: "department",
        header: t("jobs.list.col.department"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {t(`jobs.dept.${row.original.department}`)}
          </span>
        ),
      },
      {
        id: "type",
        header: t("jobs.list.col.type"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <Badge variant="outline">{t(`jobs.type.${row.original.type}`)}</Badge>
        ),
      },
      {
        id: "location",
        header: t("jobs.list.col.location"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-3.5" />
            {row.original.location}
          </span>
        ),
      },
      {
        id: "applicants",
        header: t("jobs.list.col.applicants"),
        meta: { sortable: true, className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.applicants}</span>
        ),
      },
      {
        id: "status",
        header: t("jobs.list.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={JOB_STATUS_KIND[row.original.status]}
            label={t(`jobs.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "posted",
        header: t("jobs.list.col.posted"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.posted_at)}
          </span>
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<Job>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (job) => navigate(`/jobs/${job.id}`),
    },
  ];

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
                variant="secondary"
                size="icon-sm"
                aria-label={t("jobs.list.view.table")}
              >
                <Rows3 />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("jobs.list.view.grid")}
                onClick={() => navigate("/jobs/grid")}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<Job>
          label={t("jobs.list.title")}
          columns={columns}
          data={data?.rows ?? []}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          pagination={
            data
              ? {
                  page: data.page,
                  perPage: data.per_page,
                  total: data.total,
                  pages: Math.max(1, Math.ceil(data.total / data.per_page)),
                }
              : undefined
          }
          sort={params.sort ?? { column: "posted", dir: "desc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("jobs.list.empty"),
            description: t("jobs.list.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}
