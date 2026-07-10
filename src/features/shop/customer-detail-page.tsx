import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  UserCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { api, type OrderListItem } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/money";
import { t, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/customers/{id} (build-demo-screen-catalog): CRM customer profile. Profile
 * panel (contact + status), stat tiles (orders / lifetime spend / AOV), a recent
 * orders table and a notes timeline. Read-only demo — all data from the mock.
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

const STATUS_KIND = {
  active: "success",
  vip: "info",
  blocked: "error",
} as const;

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const locale = useLocale();
  const navigate = useNavigate();

  const customerQuery = useQuery({
    queryKey: ["shop", "customers", "detail", customerId],
    queryFn: () => api.customers.get(customerId),
  });

  console.debug("[CustomerDetailPage] load", { id: customerId });

  const orderStatusKind: Record<string, StatusKind> = {
    pending: "pending",
    processing: "info",
    shipped: "info",
    delivered: "success",
    cancelled: "archived",
    refunded: "error",
  };

  if (customerQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("shop.customers.detail.title")}
          icon={UserCircle}
          breadcrumbs={[
            { label: t("nav.customers"), href: "/shop/customers" },
            { label: t("shop.customers.detail.title") },
          ]}
        />
        <Panel>
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void customerQuery.refetch(),
            }}
          />
        </Panel>
      </div>
    );
  }

  const customer = customerQuery.data;
  const loading = customerQuery.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        title={customer?.name ?? t("shop.customers.detail.title")}
        icon={UserCircle}
        breadcrumbs={[
          { label: t("nav.customers"), href: "/shop/customers" },
          { label: customer?.name ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/shop/customers",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
      />

      {loading || !customer ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-56 lg:col-span-1" />
          <Skeleton className="h-56 lg:col-span-2" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel
              title={t("shop.customers.detail.profile")}
              actions={
                <StatusBadge
                  status={STATUS_KIND[customer.status]}
                  label={t(`shop.customers.status.${customer.status}`)}
                />
              }
            >
              <dl className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="whitespace-pre-line text-muted-foreground">
                    {customer.address}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("shop.customers.detail.joined", {
                    date: format(new Date(customer.joined_at), "PP", {
                      locale: DATE_LOCALES[locale],
                    }),
                  })}
                </div>
              </dl>
            </Panel>

            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:content-start">
              <StatTile
                label={t("shop.customers.detail.orders")}
                value={String(customer.orders_count)}
              />
              <StatTile
                label={t("shop.customers.detail.spend")}
                value={formatMoney(customer.ltv, customer.currency, locale)}
              />
              <StatTile
                label={t("shop.customers.detail.aov")}
                value={formatMoney(customer.aov, customer.currency, locale)}
              />

              <div className="sm:col-span-3">
                <Panel
                  icon={ShoppingBag}
                  title={t("shop.customers.detail.recent_orders")}
                >
                  {customer.recent_orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("shop.customers.detail.no_orders")}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("shop.orders.col.number")}</TableHead>
                          <TableHead>{t("shop.orders.col.status")}</TableHead>
                          <TableHead className="text-end">
                            {t("shop.orders.col.total")}
                          </TableHead>
                          <TableHead className="w-0" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customer.recent_orders.map((order: OrderListItem) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.number}
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                status={orderStatusKind[order.status]}
                                label={t(`shop.orders.status.${order.status}`)}
                              />
                            </TableCell>
                            <TableCell className="text-end tabular-nums">
                              {formatMoney(order.total, order.currency, locale)}
                            </TableCell>
                            <TableCell className="text-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  navigate(`/shop/orders/${order.id}`)
                                }
                              >
                                {t("shop.orders.view")}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Panel>
              </div>
            </div>
          </div>

          <Panel title={t("shop.customers.detail.notes")}>
            <ol className="space-y-4">
              {customer.notes.map((note) => (
                <li key={note.id} className="flex gap-3">
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {note.author.slice(0, 1)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm">{note.text}</div>
                    <div className="text-xs text-muted-foreground">
                      {note.author} ·{" "}
                      {format(new Date(note.at), "PPp", {
                        locale: DATE_LOCALES[locale],
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </>
      )}
    </div>
  );
}
