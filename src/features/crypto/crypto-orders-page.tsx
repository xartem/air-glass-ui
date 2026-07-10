import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScrollText, X } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type CryptoOrder } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMoney, formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /crypto/orders — open and historical trade orders across two tabs, with an
 * optimistic cancel on open orders. Reachable with crypto.view.
 */

const STATUS_KIND: Record<CryptoOrder["status"], StatusKind> = {
  open: "info",
  filled: "success",
  cancelled: "archived",
};

export function CryptoOrdersPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"open" | "history">("open");
  const [cancelId, setCancelId] = useState<number | null>(null);

  const queryKey = ["crypto", "orders", tab] as const;
  const ordersQuery = useQuery({
    queryKey,
    queryFn: () => api.crypto.orders(tab),
    placeholderData: (previous) => previous,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[CryptoOrders] cancel", { id });
      return api.crypto.cancelOrder(id);
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CryptoOrder[]>(queryKey);
      queryClient.setQueryData<CryptoOrder[]>(queryKey, (old) =>
        (old ?? []).filter((order) => order.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSuccess: () => toast.success(t("crypto.orders.cancelled")),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["crypto", "orders"] });
    },
  });

  const columns = useMemo<ColumnDef<CryptoOrder>[]>(
    () => [
      {
        id: "pair",
        header: t("crypto.orders.col.pair"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.pair}</span>
        ),
      },
      {
        id: "side",
        header: t("crypto.orders.col.side"),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.side === "buy" ? "success" : "error"}
            label={t(`crypto.type.${row.original.side}`)}
          />
        ),
      },
      {
        id: "price",
        header: t("crypto.orders.col.price"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.price, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "amount",
        header: t("crypto.orders.col.amount"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(row.original.amount, locale)}
          </span>
        ),
      },
      {
        id: "filled",
        header: t("crypto.orders.col.filled"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.filled} className="w-24" />
            <span className="text-xs tabular-nums text-muted-foreground">
              {row.original.filled}%
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: t("crypto.orders.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`crypto.order_status.${row.original.status}`)}
          />
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<CryptoOrder>[] = [
    {
      key: "cancel",
      label: t("crypto.orders.cancel"),
      icon: <X className="size-4" />,
      destructive: true,
      permission: "crypto.view",
      hidden: (order) => order.status !== "open",
      onSelect: (order) => setCancelId(order.id),
    },
  ];

  const data = ordersQuery.data;
  const state = ordersQuery.isPending
    ? "loading"
    : ordersQuery.isError
      ? "error"
      : (data?.length ?? 0) === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader title={t("crypto.orders.title")} icon={ScrollText} />

      <Panel
        icon={ScrollText}
        title={t("crypto.orders.title")}
        description={t("crypto.orders.hint")}
        actions={
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "open" | "history")}
          >
            <TabsList>
              <TabsTrigger value="open">
                {t("crypto.orders.tab.open")}
              </TabsTrigger>
              <TabsTrigger value="history">
                {t("crypto.orders.tab.history")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<CryptoOrder>
          label={t("crypto.orders.title")}
          columns={columns}
          data={data ?? []}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          onRetry={() => void ordersQuery.refetch()}
          emptyState={{
            title: t("crypto.orders.empty"),
            description: t("crypto.orders.empty_hint"),
          }}
        />
      </Panel>

      <ConfirmDialog
        open={cancelId !== null}
        onOpenChange={(open) => !open && setCancelId(null)}
        title={t("crypto.orders.cancel_title")}
        description={t("crypto.orders.cancel_desc")}
        confirmLabel={t("crypto.orders.cancel")}
        destructive
        onConfirm={() => {
          if (cancelId !== null) cancelMutation.mutate(cancelId);
          setCancelId(null);
        }}
      />
    </div>
  );
}
