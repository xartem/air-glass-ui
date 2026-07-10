import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, FolderKanban, LayoutGrid, Rows3 } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type ProjectListItem, type ProjectStatus } from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { EmptyState } from "@/components/empty-state";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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

/*
 * /projects — browse projects as a card grid (default) or a table sharing one
 * query. Reachable with projects.view.
 */

const STATUS_KIND: Record<ProjectStatus, StatusKind> = {
  planning: "info",
  active: "success",
  on_hold: "pending",
  completed: "published",
};
const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "on_hold",
  "completed",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function TeamStack({ team }: { team: ProjectListItem["team"] }) {
  return (
    <AvatarGroup>
      {team.slice(0, 4).map((member) => (
        <Avatar key={member.id} className="size-7" title={member.name}>
          <AvatarFallback className="text-[10px]">
            {initials(member.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {team.length > 4 ? (
        <AvatarGroupCount>+{team.length - 4}</AvatarGroupCount>
      ) : null}
    </AvatarGroup>
  );
}

export function ProjectsListPage() {
  const navigate = useNavigate();
  const dt = useSiteDateTime();
  const params = useListParams();
  const [view, setView] = useState<"grid" | "table">("grid");

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter("status") as ProjectStatus | undefined) ?? undefined,
    sort:
      (params.sort?.column as "name" | "deadline" | "progress" | undefined) ??
      "name",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[ProjectsListPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["projects", filters],
    queryFn: () => api.projects.list(filters),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<ProjectListItem>[]>(
    () => [
      {
        id: "name",
        header: t("projects.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.client}
            </div>
          </div>
        ),
      },
      {
        id: "progress",
        header: t("projects.col.progress"),
        meta: { sortable: true, className: "max-sm:hidden" },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="w-24" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
      {
        id: "team",
        header: t("projects.col.team"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => <TeamStack team={row.original.team} />,
      },
      {
        id: "deadline",
        header: t("projects.col.deadline"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.deadline)}
          </span>
        ),
      },
      {
        id: "status",
        header: t("projects.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`projects.status.${row.original.status}`)}
          />
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<ProjectListItem>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (project) => navigate(`/projects/${project.id}`),
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
        title={t("nav.projects")}
        icon={FolderKanban}
        primaryAction={{
          label: t("projects.new"),
          href: "/projects/new",
          permission: "projects.manage",
        }}
      />

      <Panel
        icon={FolderKanban}
        title={t("nav.projects")}
        description={t("projects.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("projects.search_placeholder")}
              className="w-56"
            />
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("projects.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("projects.filter.all_statuses")}
                </SelectItem>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`projects.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={t("projects.view.grid")}
                onClick={() => setView("grid")}
              >
                <LayoutGrid />
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label={t("projects.view.table")}
                onClick={() => setView("table")}
              >
                <Rows3 />
              </Button>
            </div>
          </div>
        }
        contentClassName={view === "grid" ? "p-4" : "p-2 sm:p-3"}
      >
        {view === "table" ? (
          <DataTable<ProjectListItem>
            label={t("nav.projects")}
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
            sort={params.sort ?? { column: "name", dir: "asc" }}
            onSort={(column, dir) => params.setSort(column, dir)}
            onPage={(page) => params.setPage(page)}
            onRetry={() => void listQuery.refetch()}
            emptyState={{
              title: t("projects.empty"),
              description: t("projects.empty_hint"),
            }}
          />
        ) : state === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : state === "empty" ? (
          <EmptyState
            icon={FolderKanban}
            title={t("projects.empty")}
            description={t("projects.empty_hint")}
          />
        ) : state === "error" ? (
          <EmptyState
            icon={FolderKanban}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void listQuery.refetch(),
            }}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data?.rows.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="glass-card flex flex-col gap-3 rounded-2xl p-4 text-start transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.client}
                      </div>
                    </div>
                    <StatusBadge
                      status={STATUS_KIND[project.status]}
                      label={t(`projects.status.${project.status}`)}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("projects.col.progress")}</span>
                      <span className="tabular-nums">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <TeamStack team={project.team} />
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {dt.format(project.deadline)}
                    </span>
                  </div>
                </button>
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
