import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleDot, Clock, Hourglass, LifeBuoy } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
} from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";

/*
 * /support/tickets — helpdesk queue: KPI row, filterable ticket table and a
 * validated new-ticket dialog. Rows open the conversation. Needs support.view.
 */

export const TICKET_STATUS_KIND: Record<TicketStatus, StatusKind> = {
  open: "info",
  pending: "pending",
  solved: "success",
  closed: "archived",
};
export const TICKET_PRIORITY_KIND: Record<TicketPriority, StatusKind> = {
  low: "archived",
  normal: "info",
  high: "pending",
  urgent: "error",
};
const STATUSES: TicketStatus[] = ["open", "pending", "solved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];
export const AGENTS = ["Anna Adminson", "Evan Editor", "Olivia Parker"];

const schema = z.object({
  subject: z.string().trim().min(1),
  requester: z.string().trim().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  message: z.string().trim().min(1),
});
type FormValues = z.infer<typeof schema>;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        <div className="truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

export function TicketListPage() {
  const dt = useSiteDateTime();
  const navigate = useNavigate();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter("status") as TicketStatus | undefined) ?? undefined,
    priority:
      (params.filter("priority") as TicketPriority | undefined) ?? undefined,
    agent: params.filter("agent"),
    sort:
      (params.sort?.column as "subject" | "updated_at" | undefined) ??
      "updated_at",
    dir: params.sort?.dir ?? ("desc" as const),
  };

  console.debug("[TicketListPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["support", "tickets", filters],
    queryFn: () => api.support.list(filters),
    placeholderData: (previous) => previous,
  });
  const statsQuery = useQuery({
    queryKey: ["support", "stats"],
    queryFn: () => api.support.stats(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      requester: "",
      priority: "normal",
      message: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      console.debug("[TicketListPage] create", values);
      return api.support.create(values);
    },
    onSuccess: (ticket) => {
      toast.success(t("support.created"));
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      setCreateOpen(false);
      form.reset();
      navigate(`/support/tickets/${ticket.id}`);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<TicketListItem>[]>(
    () => [
      {
        id: "id",
        header: t("support.col.id"),
        meta: { className: "w-16 max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            #{row.original.id}
          </span>
        ),
      },
      {
        id: "subject",
        header: t("support.col.subject"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <Link
            to={`/support/tickets/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.subject}
          </Link>
        ),
      },
      {
        id: "requester",
        header: t("support.col.requester"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="flex items-center gap-2">
            <Avatar className="size-6" title={row.original.requester}>
              <AvatarFallback className="text-[10px]">
                {initials(row.original.requester)}
              </AvatarFallback>
            </Avatar>
            <span className="max-lg:hidden">{row.original.requester}</span>
          </span>
        ),
      },
      {
        id: "priority",
        header: t("support.col.priority"),
        cell: ({ row }) => (
          <StatusBadge
            status={TICKET_PRIORITY_KIND[row.original.priority]}
            label={t(`support.priority.${row.original.priority}`)}
          />
        ),
      },
      {
        id: "status",
        header: t("support.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={TICKET_STATUS_KIND[row.original.status]}
            label={t(`support.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "agent",
        header: t("support.col.agent"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.agent}</span>
        ),
      },
      {
        id: "updated_at",
        header: t("support.col.updated"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.updated_at)}
          </span>
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<TicketListItem>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (ticket) => navigate(`/support/tickets/${ticket.id}`),
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
  const stats = statsQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.support")}
        icon={LifeBuoy}
        primaryAction={{
          label: t("support.new_ticket"),
          onClick: () => setCreateOpen(true),
          permission: "support.manage",
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats ? (
          <>
            <StatTile
              icon={CircleDot}
              label={t("support.kpi.open")}
              value={String(stats.open)}
            />
            <StatTile
              icon={Hourglass}
              label={t("support.kpi.pending")}
              value={String(stats.pending)}
            />
            <StatTile
              icon={Clock}
              label={t("support.kpi.avg_response")}
              value={stats.avg_response}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-[4.5rem] rounded-2xl" />
            <Skeleton className="h-[4.5rem] rounded-2xl" />
            <Skeleton className="h-[4.5rem] rounded-2xl" />
          </>
        )}
      </div>

      <Panel
        icon={LifeBuoy}
        title={t("nav.support")}
        description={t("support.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("support.search_placeholder")}
              className="w-48"
            />
            <Select
              value={params.filter("status") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("support.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("support.filter.all_statuses")}
                </SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`support.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.filter("priority") ?? "all"}
              onValueChange={(value) =>
                params.setFilter(
                  "priority",
                  value === "all" ? undefined : value,
                )
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("support.filter.priority")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("support.filter.all_priorities")}
                </SelectItem>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(`support.priority.${priority}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.filter("agent") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("agent", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("support.filter.agent")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("support.filter.all_agents")}
                </SelectItem>
                {AGENTS.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<TicketListItem>
          label={t("nav.support")}
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
          sort={params.sort ?? { column: "updated_at", dir: "desc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("support.empty"),
            description: t("support.empty_hint"),
          }}
        />
      </Panel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("support.new_ticket")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField
              name="subject"
              label={t("support.field.subject")}
              required
              error={
                form.formState.errors.subject && t("support.error.required")
              }
            >
              <Input id="subject" {...form.register("subject")} />
            </FormField>
            <FormField
              name="requester"
              label={t("support.field.requester")}
              required
              error={
                form.formState.errors.requester && t("support.error.required")
              }
            >
              <Input id="requester" {...form.register("requester")} />
            </FormField>
            <FormField name="priority" label={t("support.field.priority")}>
              <Select
                value={form.watch("priority")}
                onValueChange={(value) =>
                  form.setValue("priority", value as TicketPriority)
                }
              >
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {t(`support.priority.${priority}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              name="message"
              label={t("support.field.message")}
              required
              error={
                form.formState.errors.message && t("support.error.required")
              }
            >
              <Textarea id="message" rows={4} {...form.register("message")} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              disabled={createMutation.isPending}
            >
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
