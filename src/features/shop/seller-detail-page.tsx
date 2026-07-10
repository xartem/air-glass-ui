import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type ProductListItem, type SellerStatus } from "@/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/sellers/:id — vendor profile: header, KPI tiles and Products / Reviews /
 * About tabs. Reachable with sellers.view.
 */

const STATUS_KIND: Record<SellerStatus, StatusKind> = {
  active: "success",
  pending: "pending",
  suspended: "error",
};

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
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

export function SellerDetailPage() {
  const { id } = useParams();
  const sellerId = Number(id);
  const locale = useLocale();
  const dt = useSiteDateTime();
  const navigate = useNavigate();

  const sellerQuery = useQuery({
    queryKey: ["shop", "sellers", "detail", sellerId],
    queryFn: () => api.sellers.get(sellerId),
  });
  const productsQuery = useQuery({
    queryKey: ["shop", "sellers", "products", sellerId],
    queryFn: () => api.sellers.products(sellerId),
  });
  const reviewsQuery = useQuery({
    queryKey: ["shop", "sellers", "reviews", sellerId],
    queryFn: () => api.products.reviews(sellerId),
  });

  console.debug("[SellerDetailPage] load", { id: sellerId });

  const columns = useMemo<ColumnDef<ProductListItem>[]>(
    () => [
      {
        id: "name",
        header: t("shop.products.col.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "sku",
        header: t("shop.products.col.sku"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.sku}</span>
        ),
      },
      {
        id: "price",
        header: t("shop.products.col.price"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.price, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [locale],
  );

  if (sellerQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("shop.sellers.detail.title")}
          icon={Store}
          breadcrumbs={[
            { label: t("nav.sellers"), href: "/shop/sellers" },
            { label: t("shop.sellers.detail.title") },
          ]}
        />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("shop.sellers.detail.not_found")}
          </div>
        </Panel>
      </div>
    );
  }

  const seller = sellerQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={seller?.name ?? t("shop.sellers.detail.title")}
        icon={Store}
        breadcrumbs={[
          { label: t("nav.sellers"), href: "/shop/sellers" },
          { label: seller?.name ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/shop/sellers",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
      />

      {!seller ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <Panel>
            <div className="flex flex-wrap items-center gap-4">
              <span
                className="flex size-16 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold text-foreground/70"
                style={{ backgroundColor: seller.logo_color }}
              >
                {seller.name.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {seller.name}
                  </h2>
                  <StatusBadge
                    status={STATUS_KIND[seller.status]}
                    label={t(`shop.sellers.status.${seller.status}`)}
                  />
                </div>
                <Rating value={seller.rating} readOnly size="sm" />
                <div className="mt-1 text-sm text-muted-foreground">
                  {seller.email} · {seller.phone} · {seller.location}
                </div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              icon={ShoppingBag}
              label={t("shop.sellers.detail.kpi.sales")}
              value={String(seller.sales_count)}
            />
            <StatTile
              icon={Package}
              label={t("shop.sellers.detail.kpi.products")}
              value={String(seller.products_count)}
            />
            <StatTile
              icon={Star}
              label={t("shop.sellers.detail.kpi.rating")}
              value={seller.rating.toFixed(1)}
            />
            <StatTile
              icon={CalendarDays}
              label={t("shop.sellers.detail.kpi.since")}
              value={dt.format(seller.joined_at)}
            />
          </div>

          <Panel contentClassName="p-0">
            <Tabs defaultValue="products">
              <TabsList className="m-4 mb-0">
                <TabsTrigger value="products">
                  {t("shop.sellers.detail.tab.products")}
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  {t("shop.sellers.detail.tab.reviews")}
                </TabsTrigger>
                <TabsTrigger value="about">
                  {t("shop.sellers.detail.tab.about")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="p-3">
                <DataTable<ProductListItem>
                  label={t("shop.sellers.detail.tab.products")}
                  columns={columns}
                  data={productsQuery.data ?? []}
                  state={
                    productsQuery.isPending
                      ? "loading"
                      : productsQuery.isError
                        ? "error"
                        : "ready"
                  }
                  getRowId={(row) => String(row.id)}
                  rowActions={[
                    {
                      key: "view",
                      label: t("common.view"),
                      onSelect: (product) =>
                        navigate(`/shop/products/${product.id}`),
                    },
                  ]}
                  onRetry={() => void productsQuery.refetch()}
                />
              </TabsContent>

              <TabsContent value="reviews" className="space-y-3 p-5">
                {(reviewsQuery.data ?? []).map((review) => (
                  <div
                    key={review.id}
                    className="space-y-1 rounded-xl border border-border/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {review.author}
                      </span>
                      <Rating value={review.rating} readOnly size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {review.body}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="about" className="p-5">
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {seller.about}
                </p>
              </TabsContent>
            </Tabs>
          </Panel>
        </>
      )}
    </div>
  );
}
