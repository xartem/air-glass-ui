import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, ValidationError, type Cart } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import { Separator } from "@/components/ui/separator";
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
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/cart — review and edit the cart before checkout. Line-items table with
 * optimistic quantity/remove edits, plus an order-summary panel (subtotal,
 * shipping, tax, promo, total). Reachable with orders.view.
 */

const CART_KEY = ["shop", "cart"];

function usableImage(src?: string): boolean {
  return Boolean(src && (src.startsWith("data:") || src.startsWith("http")));
}

export function CartPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [promo, setPromo] = useState("");

  const cartQuery = useQuery({ queryKey: CART_KEY, queryFn: api.cart.get });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) => {
      console.debug("[CartPage] updateQty", { itemId, qty });
      return api.cart.update(itemId, qty);
    },
    onMutate: async ({ itemId, qty }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      if (previous) {
        queryClient.setQueryData<Cart>(CART_KEY, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === itemId ? { ...item, qty } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(CART_KEY, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: number) => {
      console.debug("[CartPage] remove", { itemId });
      return api.cart.remove(itemId);
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart>(CART_KEY);
      if (previous) {
        queryClient.setQueryData<Cart>(CART_KEY, {
          ...previous,
          items: previous.items.filter((item) => item.id !== itemId),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(CART_KEY, context.previous);
      toast.error(t("common.request_failed"));
    },
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });

  const promoMutation = useMutation({
    mutationFn: (code: string) => {
      console.debug("[CartPage] applyPromo", { code });
      return api.cart.applyPromo(code);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(CART_KEY, cart);
      toast.success(t("shop.cart.promo_applied"));
      setPromo("");
    },
    onError: (error) => {
      toast.error(
        error instanceof ValidationError
          ? t("shop.cart.promo_invalid")
          : t("common.request_failed"),
      );
    },
  });

  const cart = cartQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.cart")} icon={ShoppingCart} />

      {cartQuery.isPending ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-72" />
          <Skeleton className="h-56" />
        </div>
      ) : cartQuery.isError ? (
        <Panel>
          <EmptyState
            icon={ShoppingCart}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void cartQuery.refetch(),
            }}
          />
        </Panel>
      ) : !cart || cart.items.length === 0 ? (
        <Panel>
          <EmptyState
            icon={ShoppingCart}
            title={t("shop.cart.empty")}
            description={t("shop.cart.empty_hint")}
            action={{
              label: t("shop.cart.browse_products"),
              onClick: () => navigate("/shop/products"),
            }}
          />
        </Panel>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
          <Panel contentClassName="p-2 sm:p-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("shop.cart.col.product")}</TableHead>
                  <TableHead className="text-end max-sm:hidden">
                    {t("shop.cart.col.price")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("shop.cart.col.qty")}
                  </TableHead>
                  <TableHead className="text-end">
                    {t("shop.cart.col.total")}
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                          {usableImage(item.image) ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Package className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {item.name}
                          </div>
                          {item.variant ? (
                            <div className="text-xs text-muted-foreground">
                              {item.variant}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-end tabular-nums max-sm:hidden">
                      {formatMoney(item.price, cart.currency, locale)}
                    </TableCell>
                    <TableCell>
                      <NumberField
                        value={item.qty}
                        onValueChange={(value) =>
                          updateMutation.mutate({
                            itemId: item.id,
                            qty: value ?? 1,
                          })
                        }
                        min={1}
                        max={99}
                        className="mx-auto w-28"
                        inputSize="sm"
                      />
                    </TableCell>
                    <TableCell className="text-end font-medium tabular-nums">
                      {formatMoney(
                        item.price * item.qty,
                        cart.currency,
                        locale,
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.delete")}
                        onClick={() => removeMutation.mutate(item.id)}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel title={t("shop.cart.summary")} className="lg:sticky lg:top-4">
            <div className="space-y-3 text-sm">
              <SummaryRow
                label={t("shop.cart.subtotal")}
                value={formatMoney(cart.totals.subtotal, cart.currency, locale)}
              />
              <SummaryRow
                label={t("shop.cart.shipping")}
                value={formatMoney(cart.totals.shipping, cart.currency, locale)}
              />
              {cart.totals.discount > 0 ? (
                <SummaryRow
                  label={t("shop.cart.discount")}
                  value={`− ${formatMoney(cart.totals.discount, cart.currency, locale)}`}
                />
              ) : null}
              <SummaryRow
                label={t("shop.cart.tax")}
                value={formatMoney(cart.totals.tax, cart.currency, locale)}
              />

              <div className="flex gap-2">
                <Input
                  value={promo}
                  onChange={(event) => setPromo(event.target.value)}
                  placeholder={t("shop.cart.promo_placeholder")}
                  aria-label={t("shop.cart.promo_placeholder")}
                />
                <Button
                  variant="outline"
                  disabled={!promo.trim() || promoMutation.isPending}
                  onClick={() => promoMutation.mutate(promo.trim())}
                >
                  {t("shop.cart.apply")}
                </Button>
              </div>

              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{t("shop.cart.total")}</span>
                <span className="tabular-nums">
                  {formatMoney(cart.totals.total, cart.currency, locale)}
                </span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => navigate("/shop/checkout")}
              >
                {t("shop.cart.checkout")}
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
