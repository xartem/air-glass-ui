import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import { Eye, LogIn, UserCircle } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type CustomerListItem, type CustomerStatus } from "@/api";
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
import { formatMoney } from "@/lib/money";
import { t, type AdminLocale } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/customers (build-demo-screen-catalog): CRM customer list. Name, email,
 * orders, lifetime value, status and join date; search + status filter in the URL.
 * Row "⋯" opens the profile or triggers a gated demo "impersonate" no-op.
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

const STATUS_KIND: Record<CustomerStatus, StatusKind> = {
  active: "success",
  vip: "info",
  blocked: "error",
};

const CUSTOMER_STATUSES: CustomerStatus[] = ["active", "vip", "blocked"];

export function CustomersPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const params = useListParams();

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status:
      (params.filter("status") as CustomerStatus | undefined) ?? undefined,
    sort:
      (params.sort?.column as
        "name" | "orders_count" | "ltv" | "joined_at" | undefined) ?? "name",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[CustomersPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["shop", "customers", filters],
    queryFn: () => api.customers.list(filters),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<CustomerListItem>[]>(
    () => [
      {
        id: "name",
        header: t("shop.customers.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="truncate font-medium">{row.original.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        id: "orders_count",
        header: t("shop.customers.col.orders"),
        meta: { sortable: true, className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.orders_count}</span>
        ),
      },
      {
        id: "ltv",
        header: t("shop.customers.col.ltv"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMoney(row.original.ltv, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "status",
        header: t("shop.customers.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.customers.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "joined_at",
        header: t("shop.customers.col.joined"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {format(new Date(row.original.joined_at), "PP", {
              locale: DATE_LOCALES[locale],
            })}
          </span>
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<CustomerListItem>[] = [
    {
      key: "view",
      label: t("shop.customers.view"),
      icon: <Eye />,
      onSelect: (customer) => navigate(`/shop/customers/${customer.id}`),
    },
    {
      key: "impersonate",
      label: t("shop.customers.impersonate"),
      icon: <LogIn />,
      permission: "customers.impersonate",
      onSelect: (customer) => {
        console.debug("[CustomersPage] impersonate (demo)", {
          id: customer.id,
        });
        toast.info(t("shop.customers.impersonate_demo"));
      },
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
      <PageHeader title={t("nav.customers")} icon={UserCircle} />

      <Panel
        icon={UserCircle}
        title={t("nav.customers")}
        description={t("shop.customers.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t("shop.customers.search_placeholder")}
              className="w-56"
            />
            <Select
              value={filters.status ?? "all"}
              onValueChange={(value) =>
                params.setFilter("status", value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("shop.customers.filter.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shop.customers.filter.all_statuses")}
                </SelectItem>
                {CUSTOMER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.customers.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<CustomerListItem>
          label={t("nav.customers")}
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
            title: t("shop.customers.empty"),
            description: t("shop.customers.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}
