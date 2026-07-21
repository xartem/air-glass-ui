import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftRight, Copy, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type CryptoTx, type CryptoTxType } from "@/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney, formatNumber } from "@/lib/money";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /crypto/transactions — the crypto ledger: KPI row over a filterable, paginated
 * table of buy/sell/transfer records. Reachable with crypto.view.
 */

const COIN_OPTIONS = ["BTC", "ETH", "USDT", "BNB", "SOL", "XRP", "ADA", "DOGE"];
const TYPE_OPTIONS: CryptoTxType[] = ["buy", "sell", "transfer"];

const TYPE_KIND: Record<CryptoTxType, StatusKind> = {
  buy: "success",
  sell: "error",
  transfer: "info",
};
const STATUS_KIND: Record<CryptoTx["status"], StatusKind> = {
  completed: "success",
  pending: "pending",
  failed: "error",
};

function truncateHash(hash: string): string {
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function CryptoTransactionsPage() {
  const locale = useLocale();
  const dt = useSiteDateTime();
  const params = useListParams();

  const filters = {
    page: params.page,
    coin: params.filter("coin"),
    type: (params.filter("type") as CryptoTxType | undefined) ?? undefined,
    from: params.filter("from"),
    to: params.filter("to"),
    sort: (params.sort?.column as "date" | "value" | undefined) ?? "date",
    dir: params.sort?.dir ?? ("desc" as const),
  };

  console.debug("[CryptoTransactions] query", filters);

  const listQuery = useQuery({
    queryKey: ["crypto", "transactions", filters],
    queryFn: () => api.crypto.transactions(filters),
    placeholderData: (previous) => previous,
  });
  const walletQuery = useQuery({
    queryKey: ["crypto", "wallet"],
    queryFn: api.crypto.wallet,
  });

  async function copyHash(hash: string) {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success(t("crypto.transactions.hash_copied"));
    } catch {
      toast.error(t("common.request_failed"));
    }
  }

  const columns = useMemo<ColumnDef<CryptoTx>[]>(
    () => [
      {
        id: "date",
        header: t("crypto.transactions.col.date"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.date)}
          </span>
        ),
      },
      {
        id: "type",
        header: t("crypto.transactions.col.type"),
        cell: ({ row }) => (
          <StatusBadge
            status={TYPE_KIND[row.original.type]}
            label={t(`crypto.type.${row.original.type}`)}
          />
        ),
      },
      {
        id: "coin",
        header: t("crypto.transactions.col.coin"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.coin}</span>
        ),
      },
      {
        id: "amount",
        header: t("crypto.transactions.col.amount"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatNumber(row.original.amount, locale)}
          </span>
        ),
      },
      {
        id: "value",
        header: t("crypto.transactions.col.value"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.value, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "status",
        header: t("crypto.transactions.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`crypto.tx_status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "hash",
        header: t("crypto.transactions.col.hash"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <code className="font-mono text-xs text-muted-foreground">
              {truncateHash(row.original.hash)}
            </code>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("crypto.transactions.copy_hash")}
              onClick={() => void copyHash(row.original.hash)}
            >
              <Copy className="size-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [dt, locale],
  );

  const data = listQuery.data;
  const state = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : (data?.rows.length ?? 0) === 0
        ? "empty"
        : "ready";
  const wallet = walletQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("crypto.transactions.title")}
        icon={ArrowLeftRight}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label={t("crypto.transactions.kpi.balance")}
          value={
            wallet
              ? formatMoney(wallet.total_value, wallet.currency, locale)
              : "—"
          }
        />
        <StatTile
          label={t("crypto.transactions.kpi.change")}
          value={wallet ? `${wallet.change_24h.toFixed(2)}%` : "—"}
          tone={wallet ? (wallet.change_24h >= 0 ? "up" : "down") : undefined}
        />
        <StatTile
          label={t("crypto.transactions.kpi.trades")}
          value={data ? formatNumber(data.total, locale) : "—"}
        />
      </div>

      <Panel
        icon={WalletIcon}
        title={t("crypto.transactions.title")}
        description={t("crypto.transactions.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={filters.coin ?? "all"}
              onValueChange={(value) =>
                params.setFilter("coin", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue
                  placeholder={t("crypto.transactions.filter.coin")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("crypto.transactions.filter.all_coins")}
                </SelectItem>
                {COIN_OPTIONS.map((coin) => (
                  <SelectItem key={coin} value={coin}>
                    {coin}
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
                <SelectValue
                  placeholder={t("crypto.transactions.filter.type")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("crypto.transactions.filter.all_types")}
                </SelectItem>
                {TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`crypto.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={{ from: filters.from, to: filters.to }}
              onChange={(next) =>
                params.setFilters({ from: next.from, to: next.to })
              }
              className="w-56"
            />
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<CryptoTx>
          label={t("crypto.transactions.title")}
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
          sort={params.sort ?? { column: "date", dir: "desc" }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("crypto.transactions.empty"),
            description: t("crypto.transactions.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down";
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className="mt-1 text-2xl font-semibold tabular-nums"
        style={
          tone
            ? {
                color:
                  tone === "up"
                    ? "var(--status-success-fg)"
                    : "var(--status-error-fg)",
              }
            : undefined
        }
      >
        {value}
      </div>
    </div>
  );
}
