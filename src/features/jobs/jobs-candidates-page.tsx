import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Rows3, Users } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type Candidate } from "@/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
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

import { useCandidateFilters } from "./use-jobs-list";
import {
  CANDIDATE_STAGES,
  CANDIDATE_STAGE_KIND,
  initials,
} from "./jobs-shared";

/*
 * /jobs/candidates — applicants as a filterable table (name, role, experience,
 * stage, rating, applied) with a toggle to the shared card grid. Reachable with
 * jobs.view.
 */

export function JobsCandidatesPage() {
  const dt = useSiteDateTime();
  const navigate = useNavigate();
  const params = useListParams();
  const filters = useCandidateFilters(params);

  const listQuery = useQuery({
    queryKey: ["jobs", "candidates", filters],
    queryFn: () => api.jobs.candidates(filters),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<Candidate>[]>(
    () => [
      {
        id: "name",
        header: t("jobs.candidates.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "role",
        header: t("jobs.candidates.col.role"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.role}</span>
        ),
      },
      {
        id: "experience",
        header: t("jobs.candidates.col.experience"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {t("jobs.candidates.years", { count: row.original.experience })}
          </span>
        ),
      },
      {
        id: "stage",
        header: t("jobs.candidates.col.stage"),
        cell: ({ row }) => (
          <StatusBadge
            status={CANDIDATE_STAGE_KIND[row.original.stage]}
            label={t(`jobs.stage.${row.original.stage}`)}
          />
        ),
      },
      {
        id: "rating",
        header: t("jobs.candidates.col.rating"),
        meta: { sortable: true, className: "max-lg:hidden" },
        cell: ({ row }) => (
          <Rating value={row.original.rating} readOnly size="sm" />
        ),
      },
      {
        id: "applied",
        header: t("jobs.candidates.col.applied"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.applied_at)}
          </span>
        ),
      },
    ],
    [dt],
  );

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
      <PageHeader title={t("jobs.candidates.title")} icon={Users} />

      <Panel
        icon={Users}
        title={t("jobs.candidates.title")}
        description={t("jobs.candidates.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("jobs.candidates.search")}
              className="w-52"
            />
            <Select
              value={filters.stage ?? "all"}
              onValueChange={(value) =>
                params.setFilter("stage", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("jobs.candidates.filter.stage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("jobs.candidates.filter.all")}
                </SelectItem>
                {CANDIDATE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {t(`jobs.stage.${stage}`)}
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
                onClick={() => navigate("/jobs/candidates/grid")}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<Candidate>
          label={t("jobs.candidates.title")}
          columns={columns}
          data={data?.rows ?? []}
          state={state}
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
          sort={params.sort ?? { column: "applied", dir: "desc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("jobs.candidates.empty"),
            description: t("jobs.candidates.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}
