import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import { CircleDollarSign, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  ValidationError,
  type Payment,
  type PaymentMethod,
  type PaymentTxnStatus,
} from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { t, type AdminLocale } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/payments (build-demo-screen-catalog): transactions ledger. A KPI row
 * (captured / refunded / pending) sits above a filterable table; captured rows
 * expose a gated refund action (ConfirmDialog + mock mutation + toast).
 */

const DATE_LOCALES: Record<AdminLocale, typeof ru> = {
  ru,
  en: enUS,
  uk,
  de,
  fr,
  es,
  it,
  pl,
  ar,
};

const STATUS_KIND: Record<PaymentTxnStatus, StatusKind> = {
  captured: "success",
  pending: "pending",
  refunded: "info",
  failed: "error",
};

const TXN_STATUSES: PaymentTxnStatus[] = [
  "captured",
  "pending",
  "refunded",
  "failed",
];
const METHODS: PaymentMethod[] = ["card", "paypal", "transfer", "cash"];

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function PaymentsPage() {
  const locale = useLocale();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status:
      (params.filter("status") as PaymentTxnStatus | undefined) ?? undefined,
    method: (params.filter("method") as PaymentMethod | undefined) ?? undefined,
    from: params.filter("from"),
    to: params.filter("to"),
    sort:
      (params.sort?.column as "created_at" | "amount" | undefined) ??
      "created_at",
    dir: params.sort?.dir ?? ("desc" as const),
  };

  console.debug("[PaymentsPage] query", filters);

  const statsQuery = useQuery({
    queryKey: ["shop", "payments", "stats"],
    queryFn: api.payments.stats,
    staleTime: 30_000,
  });
  const listQuery = useQuery({
    queryKey: ["shop", "payments", filters],
    queryFn: () => api.payments.list(filters),
    placeholderData: (previous) => previous,
  });

  const refundMutation = useMutation({
    mutationFn: (id: number) => api.payments.refund(id),
    onSuccess: () => {
      console.debug("[PaymentsPage] refund done");
      toast.success(t("shop.payments.refunded"));
      void queryClient.invalidateQueries({ queryKey: ["shop", "payments"] });
    },
    onError: (cause) => {
      const code =
        cause instanceof ValidationError ? cause.fields._error : undefined;
      toast.error(
        code
          ? t("shop.payments.error.not_refundable")
          : t("common.request_failed"),
      );
    },
  });

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "txn",
        header: t("shop.payments.col.txn"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.txn}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.customer_name}
            </div>
          </div>
        ),
      },
      {
        id: "order",
        header: t("shop.payments.col.order"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.order_number}
          </span>
        ),
      },
      {
        id: "method",
        header: t("shop.payments.col.method"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span>{t(`shop.payments.method.${row.original.method}`)}</span>
        ),
      },
      {
        id: "status",
        header: t("shop.payments.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.payments.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "created_at",
        header: t("shop.payments.col.date"),
        meta: { sortable: true, className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {format(new Date(row.original.created_at), "PP", {
              locale: DATE_LOCALES[locale],
            })}
          </span>
        ),
      },
      {
        id: "amount",
        header: t("shop.payments.col.amount"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatMoney(row.original.amount, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<Payment>[] = [
    {
      key: "refund",
      label: t("shop.payments.refund"),
      icon: <Undo2 />,
      destructive: true,
      permission: "payments.refund",
      hidden: (payment) => payment.status !== "captured",
      onSelect: (payment) => setRefundTarget(payment),
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
      <PageHeader title={t("nav.payments")} icon={CircleDollarSign} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label={t("shop.payments.kpi.captured")}
          value={
            stats ? formatMoney(stats.captured, stats.currency, locale) : "—"
          }
        />
        <Kpi
          label={t("shop.payments.kpi.refunded")}
          value={
            stats ? formatMoney(stats.refunded, stats.currency, locale) : "—"
          }
        />
        <Kpi
          label={t("shop.payments.kpi.pending")}
          value={
            stats ? formatMoney(stats.pending, stats.currency, locale) : "—"
          }
        />
      </div>

      <Panel
        icon={CircleDollarSign}
        title={t("nav.payments")}
        description={t("shop.payments.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("shop.payments.search_placeholder")}
              className="w-52"
            />
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("shop.payments.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shop.payments.filter.all_statuses")}
                </SelectItem>
                {TXN_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.payments.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.method ?? "all"}
              onValueChange={(value) =>
                params.setFilter("method", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("shop.payments.filter.method")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shop.payments.filter.all_methods")}
                </SelectItem>
                {METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {t(`shop.payments.method.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              aria-label={t("shop.payments.filter.from")}
              value={filters.from ?? ""}
              onChange={(event) =>
                params.setFilter("from", event.target.value || undefined)
              }
              className="w-40"
            />
            <Input
              type="date"
              aria-label={t("shop.payments.filter.to")}
              value={filters.to ?? ""}
              onChange={(event) =>
                params.setFilter("to", event.target.value || undefined)
              }
              className="w-40"
            />
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<Payment>
          label={t("nav.payments")}
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
            title: t("shop.payments.empty"),
            description: t("shop.payments.empty_hint"),
          }}
        />
      </Panel>

      <ConfirmDialog
        open={refundTarget !== null}
        onOpenChange={(open) => !open && setRefundTarget(null)}
        title={t("shop.payments.refund_confirm.title")}
        description={t("shop.payments.refund_confirm.description", {
          amount: refundTarget
            ? formatMoney(refundTarget.amount, refundTarget.currency, locale)
            : "",
        })}
        confirmLabel={t("shop.payments.refund")}
        destructive
        onConfirm={() => {
          if (refundTarget) refundMutation.mutate(refundTarget.id);
          setRefundTarget(null);
        }}
      />
    </div>
  );
}
