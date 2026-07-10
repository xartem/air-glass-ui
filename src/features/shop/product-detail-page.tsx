import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Pencil, ShoppingCart } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { api, type Product, type ProductReview } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Rating } from "@/components/ui/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSiteDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * /shop/products/:id — customer-style product detail (read view), distinct from
 * the editor form. Media gallery + buy box (rating, stock, variant, qty,
 * add-to-cart) and Description / Specs / Reviews tabs. Reachable with products.view.
 */

const STOCK_KIND = (stock: number): StatusKind =>
  stock === 0 ? "error" : stock < 10 ? "pending" : "success";

const VARIANTS = ["default", "large", "bundle"];

function usableImage(src?: string): boolean {
  return Boolean(src && (src.startsWith("data:") || src.startsWith("http")));
}

export function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const locale = useLocale();
  const [variant, setVariant] = useState(VARIANTS[0]!);
  const [qty, setQty] = useState(1);

  const productQuery = useQuery({
    queryKey: ["shop", "products", "detail", productId],
    queryFn: () => api.products.get(productId),
  });
  const reviewsQuery = useQuery({
    queryKey: ["shop", "products", "reviews", productId],
    queryFn: () => api.products.reviews(productId),
  });

  console.debug("[ProductDetailPage] load", { id: productId });

  if (productQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("shop.products.detail.title")}
          icon={Package}
          breadcrumbs={[
            { label: t("nav.products"), href: "/shop/products" },
            { label: t("shop.products.detail.title") },
          ]}
        />
        <Panel>
          <div className="py-10 text-center text-sm text-muted-foreground">
            {t("shop.products.detail.not_found")}
          </div>
        </Panel>
      </div>
    );
  }

  const product: Product | undefined = productQuery.data;
  const reviews = reviewsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title={product?.name ?? t("shop.products.detail.title")}
        icon={Package}
        breadcrumbs={[
          { label: t("nav.products"), href: "/shop/products" },
          { label: product?.name ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/shop/products",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
        primaryAction={{
          label: t("common.edit"),
          href: `/shop/products/${productId}/edit`,
          icon: <Pencil />,
          permission: "products.manage",
        }}
      />

      {!product ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          <Panel>
            <div className="grid gap-8 lg:grid-cols-2">
              <Gallery image={product.image} name={product.name} />

              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <Rating value={4} readOnly size="sm" />
                    <span className="text-sm text-muted-foreground">
                      {t("shop.products.detail.reviews_count", {
                        count: reviews.length,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-semibold tabular-nums">
                    {formatMoney(product.price, product.currency, locale)}
                  </span>
                  {product.compare_at_price ? (
                    <span className="text-lg text-muted-foreground line-through tabular-nums">
                      {formatMoney(
                        product.compare_at_price,
                        product.currency,
                        locale,
                      )}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={STOCK_KIND(product.stock)}
                    label={
                      product.stock === 0
                        ? t("shop.products.out_of_stock")
                        : t("shop.products.detail.in_stock", {
                            count: product.stock,
                          })
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    {product.sku}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">
                      {t("shop.products.detail.variant")}
                    </span>
                    <Select value={variant} onValueChange={setVariant}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VARIANTS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`shop.products.detail.variant.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">
                      {t("shop.products.detail.qty")}
                    </span>
                    <NumberField
                      value={qty}
                      onValueChange={(value) => setQty(value ?? 1)}
                      min={1}
                      max={99}
                    />
                  </label>
                </div>

                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={product.stock === 0}
                  onClick={() => {
                    console.debug("[ProductDetailPage] addToCart", {
                      id: productId,
                      variant,
                      qty,
                    });
                    toast.success(t("shop.products.detail.added_to_cart"));
                  }}
                >
                  <ShoppingCart />
                  {t("shop.products.detail.add_to_cart")}
                </Button>
              </div>
            </div>
          </Panel>

          <Panel contentClassName="p-0">
            <Tabs defaultValue="description">
              <TabsList className="m-4 mb-0">
                <TabsTrigger value="description">
                  {t("shop.products.detail.tab.description")}
                </TabsTrigger>
                <TabsTrigger value="specs">
                  {t("shop.products.detail.tab.specs")}
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  {t("shop.products.detail.tab.reviews")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="p-5">
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </TabsContent>

              <TabsContent value="specs" className="p-5">
                <dl className="grid max-w-lg gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                  <SpecRow
                    label={t("shop.products.detail.spec.sku")}
                    value={product.sku}
                  />
                  <SpecRow
                    label={t("shop.products.detail.spec.category")}
                    value={product.category}
                  />
                  <SpecRow
                    label={t("shop.products.detail.spec.weight")}
                    value={`${product.weight} kg`}
                  />
                  <SpecRow
                    label={t("shop.products.detail.spec.stock")}
                    value={String(product.stock)}
                  />
                </dl>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4 p-5">
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("shop.products.detail.no_reviews")}
                  </p>
                ) : (
                  reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Panel>
        </>
      )}
    </div>
  );
}

function Gallery({ image, name }: { image?: string; name: string }) {
  const [active, setActive] = useState(0);
  const usable = usableImage(image);
  return (
    <div className="space-y-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted">
        {usable ? (
          <img src={image} alt={name} className="size-full object-cover" />
        ) : (
          <Package className="size-16 text-muted-foreground" />
        )}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActive(index)}
            aria-label={t("shop.products.detail.thumb", { index: index + 1 })}
            className={cn(
              "flex size-16 items-center justify-center overflow-hidden rounded-xl bg-muted ring-2 transition-colors",
              active === index ? "ring-primary" : "ring-transparent",
            )}
          >
            {usable ? (
              <img src={image} alt="" className="size-full object-cover" />
            ) : (
              <Package className="size-5 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/40 pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  const dt = useSiteDateTime();
  return (
    <div className="space-y-1.5 rounded-xl border border-border/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{review.author}</span>
        <span className="text-xs text-muted-foreground">
          {dt.format(review.created_at)}
        </span>
      </div>
      <Rating value={review.rating} readOnly size="sm" />
      <p className="text-sm font-medium">{review.title}</p>
      <p className="text-sm text-muted-foreground">{review.body}</p>
    </div>
  );
}
