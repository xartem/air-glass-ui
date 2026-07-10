import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Rows3, Store } from "lucide-react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type SellerListItem, type SellerStatus } from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/sellers — marketplace vendor directory. Toolbar (search + status) with a
 * DataTable / card-grid toggle sharing one query. Reachable with sellers.view.
 */

const STATUS_KIND: Record<SellerStatus, StatusKind> = {
  active: "success",
  pending: "pending",
  suspended: "error",
};
const SELLER_STATUSES: SellerStatus[] = ["active", "pending", "suspended"];

function SellerLogo({ color, name }: { color: string; name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-foreground/70"
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

export function SellersPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const params = useListParams();
  const [view, setView] = useState<"table" | "grid">("table");

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter("status") as SellerStatus | undefined) ?? undefined,
    sort:
      (params.sort?.column as
        | "name"
        | "products_count"
        | "revenue"
        | "rating"
        | "joined_at"
        | undefined) ?? "name",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[SellersPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["shop", "sellers", filters],
    queryFn: () => api.sellers.list(filters),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<SellerListItem>[]>(
    () => [
      {
        id: "name",
        header: t("shop.sellers.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <SellerLogo
              color={row.original.logo_color}
              name={row.original.name}
            />
            <span className="truncate font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "products_count",
        header: t("shop.sellers.col.products"),
        meta: { sortable: true, className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.products_count}</span>
        ),
      },
      {
        id: "revenue",
        header: t("shop.sellers.col.revenue"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.revenue, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "rating",
        header: t("shop.sellers.col.rating"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => <Rating value={row.original.rating} readOnly size="sm" />,
      },
      {
        id: "status",
        header: t("shop.sellers.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.sellers.status.${row.original.status}`)}
          />
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<SellerListItem>[] = [
    {
      key: "view",
      label: t("common.view"),
      onSelect: (seller) => navigate(`/shop/sellers/${seller.id}`),
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

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-lg border p-0.5">
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("shop.sellers.view.table")}
        onClick={() => setView("table")}
      >
        <Rows3 />
      </Button>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={t("shop.sellers.view.grid")}
        onClick={() => setView("grid")}
      >
        <LayoutGrid />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.sellers")} icon={Store} />

      <Panel
        icon={Store}
        title={t("nav.sellers")}
        description={t("shop.sellers.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("shop.sellers.search_placeholder")}
              className="w-56"
            />
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("shop.sellers.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shop.sellers.filter.all_statuses")}
                </SelectItem>
                {SELLER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.sellers.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewToggle}
          </div>
        }
        contentClassName={view === "grid" ? "p-4" : "p-2 sm:p-3"}
      >
        {view === "table" ? (
          <DataTable<SellerListItem>
            label={t("nav.sellers")}
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
              title: t("shop.sellers.empty"),
              description: t("shop.sellers.empty_hint"),
            }}
          />
        ) : state === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : state === "empty" ? (
          <EmptyState
            icon={Store}
            title={t("shop.sellers.empty")}
            description={t("shop.sellers.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data?.rows.map((seller) => (
              <button
                key={seller.id}
                type="button"
                onClick={() => navigate(`/shop/sellers/${seller.id}`)}
                className="glass-card space-y-3 rounded-2xl p-4 text-start transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <SellerLogo color={seller.logo_color} name={seller.name} />
                  <div className="min-w-0">
                    <div className="truncate font-medium">{seller.name}</div>
                    <Rating value={seller.rating} readOnly size="sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("shop.sellers.card.products", {
                      count: seller.products_count,
                    })}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatMoney(seller.revenue, seller.currency, locale)}
                  </span>
                </div>
                <StatusBadge
                  status={STATUS_KIND[seller.status]}
                  label={t(`shop.sellers.status.${seller.status}`)}
                />
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
