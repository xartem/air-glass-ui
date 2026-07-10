import { Link } from "react-router";
import { Store, ShoppingCart } from "lucide-react";

import type { EcommerceDashboardPayload, OrderStatus } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { devDebug } from "@/lib/debug";
import { t } from "@/lib/i18n";
import { formatCompactMoney, formatMoney } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { CategoryBars } from "@/components/charts/category-bars";
import { Donut } from "@/components/charts/donut";
import { TrendChart } from "@/components/charts/trend-chart";
import { KpiTile, RankedList } from "./widgets";

/*
 * Ecommerce dashboard: store performance for a period. KPI row + revenue area +
 * category donut, then recent orders, best sellers and traffic sources.
 */

const STATUS_KIND: Record<OrderStatus, StatusKind> = {
  pending: "pending",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "archived",
  refunded: "error",
};

export function EcommerceDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="ecommerce"
      icon={Store}
      title={t("dash.ecommerce.title")}
      subtitle={t("dash.ecommerce.subtitle")}
    >
      {(data: EcommerceDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.ecommerce.kpi.revenue")}
              kpi={data.kpis.revenue}
              format="money"
              currency={data.currency}
            />
            <KpiTile
              label={t("dash.ecommerce.kpi.orders")}
              kpi={data.kpis.orders}
              format="count"
            />
            <KpiTile
              label={t("dash.ecommerce.kpi.aov")}
              kpi={data.kpis.aov}
              format="money"
              currency={data.currency}
            />
            <KpiTile
              label={t("dash.ecommerce.kpi.refunds")}
              kpi={data.kpis.refunds}
              format="count"
              invertDelta
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <Panel
                icon={ShoppingCart}
                title={t("dash.ecommerce.revenue.title")}
                description={t("dash.ecommerce.revenue.hint")}
              >
                {data.revenue.length === 0 ? (
                  <EmptyState title={t("table.empty.title")} />
                ) : (
                  <TrendChart
                    data={data.revenue}
                    seriesList={[
                      {
                        key: "value",
                        label: t("dash.ecommerce.revenue.title"),
                        color: "var(--chart-1)",
                      },
                    ]}
                    ariaLabel={t("dash.ecommerce.revenue.title")}
                    formatValue={(value) =>
                      formatMoney(value, data.currency, locale)
                    }
                  />
                )}
              </Panel>
            </div>
            <Panel
              title={t("dash.ecommerce.categories.title")}
              description={t("dash.ecommerce.categories.hint")}
            >
              {data.categories.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Donut
                  data={data.categories.map((row) => ({
                    label: t(`dash.ecommerce.category.${row.label}`),
                    value: row.value,
                  }))}
                  ariaLabel={t("dash.ecommerce.categories.title")}
                  formatValue={(value) =>
                    formatCompactMoney(value, data.currency, locale)
                  }
                />
              )}
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel
              title={t("dash.ecommerce.orders.title")}
              description={t("dash.ecommerce.orders.hint")}
            >
              {data.recentOrders.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {data.recentOrders.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/shop/orders/${order.id}`}
                          onClick={() =>
                            devDebug(
                              "[ecommerceDashboard] open order",
                              order.id,
                            )
                          }
                          className="font-medium hover:underline"
                        >
                          {order.code}
                        </Link>
                        <div className="truncate text-xs text-muted-foreground">
                          {order.customer}
                        </div>
                      </div>
                      <StatusBadge
                        status={STATUS_KIND[order.status]}
                        label={t(`shop.orders.status.${order.status}`)}
                      />
                      <span className="shrink-0 text-sm tabular-nums">
                        {formatMoney(order.total, data.currency, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel
              title={t("dash.ecommerce.bestSellers.title")}
              description={t("dash.ecommerce.bestSellers.hint")}
            >
              {data.topProducts.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <RankedList
                  rows={data.topProducts}
                  format="compactMoney"
                  currency={data.currency}
                />
              )}
            </Panel>
            <Panel
              title={t("dash.ecommerce.sources.title")}
              description={t("dash.ecommerce.sources.hint")}
            >
              {data.sources.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <CategoryBars
                  data={data.sources.map((row) => ({
                    label: t(`dash.ecommerce.source.${row.label}`),
                    value: row.value,
                  }))}
                  ariaLabel={t("dash.ecommerce.sources.title")}
                  height={220}
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
