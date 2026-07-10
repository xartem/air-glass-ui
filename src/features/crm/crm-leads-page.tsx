import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type Lead, type LeadStatus } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Progress } from "@/components/ui/progress";
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
 * /crm/leads — inbound leads triage: filterable table with a score bar and a
 * "convert to deal" row action. Reachable with crm.leads.
 */

const STATUS_KIND: Record<LeadStatus, StatusKind> = {
  new: "info",
  contacted: "pending",
  qualified: "success",
  unqualified: "archived",
};
const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "unqualified"];
const SOURCES = ["Website", "Referral", "Ad campaign", "Event", "Cold call"];

export function CrmLeadsPage() {
  const dt = useSiteDateTime();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [convert, setConvert] = useState<Lead | null>(null);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter("status") as LeadStatus | undefined) ?? undefined,
    source: params.filter("source"),
    sort:
      (params.sort?.column as "name" | "score" | "created_at" | undefined) ??
      "created_at",
    dir: params.sort?.dir ?? ("desc" as const),
  };

  console.debug("[CrmLeadsPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["crm", "leads", filters],
    queryFn: () => api.crm.leads.list(filters),
    placeholderData: (previous) => previous,
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[CrmLeadsPage] convert", { id });
      return api.crm.leads.convert(id);
    },
    onSuccess: () => {
      toast.success(t("crm.leads.converted"));
      void queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
      void queryClient.invalidateQueries({ queryKey: ["crm", "deals"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "name",
        header: t("crm.leads.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "source",
        header: t("crm.leads.col.source"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.source}</span>
        ),
      },
      {
        id: "score",
        header: t("crm.leads.col.score"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.score} className="w-20" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.original.score}
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: t("crm.leads.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`crm.leads.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "owner",
        header: t("crm.leads.col.owner"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.owner}</span>
        ),
      },
      {
        id: "created_at",
        header: t("crm.leads.col.created"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.created_at)}
          </span>
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<Lead>[] = [
    {
      key: "convert",
      label: t("crm.leads.convert"),
      onSelect: (lead) => setConvert(lead),
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
        title={t("crm.leads.title")}
        icon={UserPlus}
        primaryAction={{
          label: t("crm.leads.import"),
          onClick: () => toast.info(t("crm.leads.import_hint")),
          permission: "crm.leads",
        }}
      />

      <Panel
        icon={UserPlus}
        title={t("crm.leads.title")}
        description={t("crm.leads.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("crm.leads.search_placeholder")}
              className="w-48"
            />
            <Select
              value={params.filter("status") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("crm.leads.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("crm.leads.filter.all_statuses")}
                </SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`crm.leads.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={params.filter("source") ?? "all"}
              onValueChange={(value) =>
                params.setFilter("source", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("crm.leads.filter.source")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("crm.leads.filter.all_sources")}
                </SelectItem>
                {SOURCES.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<Lead>
          label={t("crm.leads.title")}
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
          sort={params.sort ?? { column: "created_at", dir: "desc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("crm.leads.empty"),
            description: t("crm.leads.empty_hint"),
          }}
        />
      </Panel>

      <ConfirmDialog
        open={convert !== null}
        onOpenChange={(open) => !open && setConvert(null)}
        title={t("crm.leads.convert_title")}
        description={
          convert
            ? t("crm.leads.convert_description", { name: convert.name })
            : ""
        }
        confirmLabel={t("crm.leads.convert")}
        onConfirm={() => {
          if (convert) convertMutation.mutate(convert.id);
          setConvert(null);
        }}
      />
    </div>
  );
}
