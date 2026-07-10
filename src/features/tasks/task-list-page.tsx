import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Columns3, ListTodo } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  type Paginated,
  type TaskListItem,
  type TaskPriority,
  type TaskStatus,
} from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { BulkBar, SearchInput } from "@/components/toolbar";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
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
 * /tasks — flat task list across projects with inline optimistic status change,
 * filters and bulk selection. Links to the kanban board. Reachable with tasks.view.
 */

const PRIORITY_KIND: Record<TaskPriority, StatusKind> = {
  low: "archived",
  medium: "info",
  high: "pending",
  urgent: "error",
};
const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const PROJECTS = [
  "Website Redesign",
  "Mobile App v2",
  "Brand Refresh",
  "Customer Portal",
  "API Platform",
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function TaskListPage() {
  const dt = useSiteDateTime();
  const navigate = useNavigate();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<TaskListItem[]>([]);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    project: params.filter("project"),
    priority: (params.filter("priority") as TaskPriority | undefined) ?? undefined,
    status: (params.filter("status") as TaskStatus | undefined) ?? undefined,
    sort: (params.sort?.column as "title" | "due" | "priority" | undefined) ?? "due",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[TaskListPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => api.tasks.list(filters),
    placeholderData: (previous) => previous,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => {
      console.debug("[TaskListPage] setStatus", { id, status });
      return api.tasks.setStatus(id, status);
    },
    onMutate: async ({ id, status }) => {
      const key = ["tasks", filters];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Paginated<TaskListItem>>(key);
      if (previous) {
        queryClient.setQueryData<Paginated<TaskListItem>>(key, {
          ...previous,
          rows: previous.rows.map((task) =>
            task.id === id ? { ...task, status } : task,
          ),
        });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(context.key, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const columns = useMemo<ColumnDef<TaskListItem>[]>(
    () => [
      {
        id: "title",
        header: t("tasks.col.title"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <Link
            to={`/tasks/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "project",
        header: t("tasks.col.project"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.project}</span>
        ),
      },
      {
        id: "assignee",
        header: t("tasks.col.assignee"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <Avatar className="size-6" title={row.original.assignee}>
              <AvatarFallback className="text-[10px]">
                {initials(row.original.assignee)}
              </AvatarFallback>
            </Avatar>
            <span className="max-lg:hidden">{row.original.assignee}</span>
          </span>
        ),
      },
      {
        id: "priority",
        header: t("tasks.col.priority"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <StatusBadge
            status={PRIORITY_KIND[row.original.priority]}
            label={t(`tasks.priority.${row.original.priority}`)}
          />
        ),
      },
      {
        id: "status",
        header: t("tasks.col.status"),
        cell: ({ row }) => (
          <Select
            value={row.original.status}
            onValueChange={(value) =>
              statusMutation.mutate({
                id: row.original.id,
                status: value as TaskStatus,
              })
            }
          >
            <SelectTrigger className="h-8 w-32" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`tasks.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "due",
        header: t("tasks.col.due"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.due)}
          </span>
        ),
      },
    ],
    [dt, statusMutation],
  );

  const rowActions: RowAction<TaskListItem>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (task) => navigate(`/tasks/${task.id}`),
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
        title={t("nav.tasks")}
        icon={ListTodo}
        secondaryActions={[
          {
            label: t("tasks.board_view"),
            href: "/kanban",
            icon: <Columns3 />,
            permission: "kanban.view",
          },
        ]}
      />

      <Panel
        icon={ListTodo}
        title={t("nav.tasks")}
        description={t("tasks.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("tasks.search_placeholder")}
              className="w-48"
            />
            <Select
              value={params.filter("project") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("project", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("tasks.filter.project")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tasks.filter.all_projects")}</SelectItem>
                {PROJECTS.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.filter("priority") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("priority", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("tasks.filter.priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tasks.filter.all_priorities")}</SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`tasks.priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.filter("status") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("tasks.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("tasks.filter.all_statuses")}</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`tasks.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        {selected.length > 0 ? (
          <div className="mb-2">
            <BulkBar
              selectedCount={selected.length}
              actions={[
                {
                  label: t("tasks.bulk.mark_done"),
                  onClick: () => {
                    selected.forEach((task) =>
                      statusMutation.mutate({ id: task.id, status: "done" }),
                    );
                    toast.success(t("tasks.bulk.done_toast"));
                    setSelected([]);
                  },
                },
              ]}
            />
          </div>
        ) : null}

        <DataTable<TaskListItem>
          label={t("nav.tasks")}
          columns={columns}
          data={data?.rows ?? []}
          state={state}
          selection
          onSelectionChange={setSelected}
          selectionResetKey={data?.page}
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
          sort={params.sort ?? { column: "due", dir: "asc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("tasks.empty"),
            description: t("tasks.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}
