import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type ShippingMethod } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
} from "@/components/ui/stepper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * /shop/checkout — place an order across four steps (address, shipping, payment,
 * review) with a sticky order-summary aside. An empty cart redirects back to the
 * cart. Placing the order routes to the new order detail. Reachable with orders.view.
 */

const COUNTRIES = ["US", "CA", "GB", "DE", "FR"];
const PAYMENT_METHODS = ["card", "paypal", "cod"] as const;

const addressSchema = z.object({
  name: z.string().min(1, "required"),
  phone: z.string().min(1, "required"),
  country: z.string().min(1, "required"),
  address: z.string().min(1, "required"),
  city: z.string().min(1, "required"),
  zip: z.string().min(1, "required"),
});
type AddressValues = z.infer<typeof addressSchema>;

const STEP_KEYS = ["address", "shipping", "payment", "review"] as const;

export function CheckoutPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [shippingId, setShippingId] = useState("standard");
  const [payment, setPayment] =
    useState<(typeof PAYMENT_METHODS)[number]>("card");

  const cartQuery = useQuery({
    queryKey: ["shop", "cart"],
    queryFn: api.cart.get,
  });
  const shippingQuery = useQuery({
    queryKey: ["shop", "shipping"],
    queryFn: api.shipping.methods,
  });

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      country: "US",
      address: "",
      city: "",
      zip: "",
    },
  });

  const cart = cartQuery.data;
  useEffect(() => {
    if (cartQuery.isSuccess && cart && cart.items.length === 0) {
      navigate("/shop/cart", { replace: true });
    }
  }, [cartQuery.isSuccess, cart, navigate]);

  const placeMutation = useMutation({
    mutationFn: () => {
      const address = form.getValues();
      const selected = shippingQuery.data?.find(
        (entry) => entry.id === shippingId,
      );
      const method = selected?.name ?? shippingId;
      console.debug("[CheckoutPage] placeOrder", { method, payment });
      return api.orders.place({
        address,
        shipping_method: method,
        shipping_price: selected?.price,
        payment_method: t(`shop.checkout.payment.${payment}`),
      });
    },
    onSuccess: (order) => {
      toast.success(t("shop.checkout.placed"));
      navigate(`/shop/orders/${order.id}`);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const selectedShipping = shippingQuery.data?.find(
    (entry) => entry.id === shippingId,
  );

  async function next() {
    if (step === 0) {
      const valid = await form.trigger();
      if (!valid) return;
    }
    console.debug("[CheckoutPage] step", { from: step, to: step + 1 });
    setStep((current) => Math.min(STEP_KEYS.length - 1, current + 1));
  }

  if (cartQuery.isPending) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("nav.checkout")} icon={CreditCard} />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const currency = cart?.currency ?? "USD";

  return (
    <div className="space-y-4">
      <PageHeader title={t("nav.checkout")} icon={CreditCard} />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Panel>
            <Stepper activeStep={step}>
              {STEP_KEYS.map((key, index) => (
                <StepperItem key={key} index={index}>
                  <StepperIndicator>{index + 1}</StepperIndicator>
                  <div className="hidden sm:block">
                    <StepperTitle>
                      {t(`shop.checkout.step.${key}`)}
                    </StepperTitle>
                    <StepperDescription>
                      {t("shop.checkout.step_n", { n: index + 1 })}
                    </StepperDescription>
                  </div>
                  <StepperSeparator />
                </StepperItem>
              ))}
            </Stepper>
          </Panel>

          <Panel title={t(`shop.checkout.step.${STEP_KEYS[step]}`)}>
            {step === 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  name="name"
                  label={t("shop.checkout.field.name")}
                  required
                  error={
                    form.formState.errors.name &&
                    t("shop.checkout.error.required")
                  }
                >
                  <Input id="name" {...form.register("name")} />
                </FormField>
                <FormField
                  name="phone"
                  label={t("shop.checkout.field.phone")}
                  required
                  error={
                    form.formState.errors.phone &&
                    t("shop.checkout.error.required")
                  }
                >
                  <Input id="phone" {...form.register("phone")} />
                </FormField>
                <FormField
                  name="country"
                  label={t("shop.checkout.field.country")}
                >
                  <Select
                    value={form.watch("country")}
                    onValueChange={(value) =>
                      form.setValue("country", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger id="country" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {t(`shop.checkout.country.${code}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField
                  name="zip"
                  label={t("shop.checkout.field.zip")}
                  required
                  error={
                    form.formState.errors.zip &&
                    t("shop.checkout.error.required")
                  }
                >
                  <Input id="zip" {...form.register("zip")} />
                </FormField>
                <FormField
                  name="address"
                  label={t("shop.checkout.field.address")}
                  required
                  className="sm:col-span-2"
                  error={
                    form.formState.errors.address &&
                    t("shop.checkout.error.required")
                  }
                >
                  <Input id="address" {...form.register("address")} />
                </FormField>
                <FormField
                  name="city"
                  label={t("shop.checkout.field.city")}
                  required
                  error={
                    form.formState.errors.city &&
                    t("shop.checkout.error.required")
                  }
                >
                  <Input id="city" {...form.register("city")} />
                </FormField>
              </div>
            ) : step === 1 ? (
              shippingQuery.data ? (
                <RadioGroup
                  value={shippingId}
                  onValueChange={setShippingId}
                  className="gap-3"
                >
                  {shippingQuery.data.map((method) => (
                    <ShippingCard
                      key={method.id}
                      method={method}
                      selected={shippingId === method.id}
                      currency={currency}
                    />
                  ))}
                </RadioGroup>
              ) : (
                <Skeleton className="h-32" />
              )
            ) : step === 2 ? (
              <Tabs
                value={payment}
                onValueChange={(value) =>
                  setPayment(value as (typeof PAYMENT_METHODS)[number])
                }
              >
                <TabsList>
                  {PAYMENT_METHODS.map((method) => (
                    <TabsTrigger key={method} value={method}>
                      {t(`shop.checkout.payment.${method}`)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent
                  value="card"
                  className="grid gap-4 pt-4 sm:grid-cols-2"
                >
                  <FormField
                    name="card_number"
                    label={t("shop.checkout.card.number")}
                  >
                    <Input id="card_number" placeholder="•••• •••• •••• 4242" />
                  </FormField>
                  <FormField
                    name="card_name"
                    label={t("shop.checkout.card.name")}
                  >
                    <Input id="card_name" />
                  </FormField>
                  <FormField
                    name="card_expiry"
                    label={t("shop.checkout.card.expiry")}
                  >
                    <Input id="card_expiry" placeholder="MM/YY" />
                  </FormField>
                  <FormField
                    name="card_cvc"
                    label={t("shop.checkout.card.cvc")}
                  >
                    <Input id="card_cvc" placeholder="•••" />
                  </FormField>
                </TabsContent>
                <TabsContent value="paypal" className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("shop.checkout.payment.paypal_hint")}
                  </p>
                </TabsContent>
                <TabsContent value="cod" className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t("shop.checkout.payment.cod_hint")}
                  </p>
                </TabsContent>
              </Tabs>
            ) : (
              <dl className="space-y-3 text-sm">
                <ReviewRow
                  label={t("shop.checkout.review.ship_to")}
                  value={`${form.watch("name")} · ${form.watch("address")}, ${form.watch("city")}`}
                />
                <ReviewRow
                  label={t("shop.checkout.review.shipping")}
                  value={selectedShipping?.name ?? "—"}
                />
                <ReviewRow
                  label={t("shop.checkout.review.payment")}
                  value={t(`shop.checkout.payment.${payment}`)}
                />
              </dl>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                {t("common.back")}
              </Button>
              {step < STEP_KEYS.length - 1 ? (
                <Button onClick={next}>{t("wizard.next")}</Button>
              ) : (
                <Button
                  onClick={() => placeMutation.mutate()}
                  disabled={placeMutation.isPending}
                >
                  {t("shop.checkout.place_order")}
                </Button>
              )}
            </div>
          </Panel>
        </div>

        <Panel
          title={t("shop.checkout.summary")}
          className="lg:sticky lg:top-4"
        >
          {cart ? (
            <div className="space-y-3 text-sm">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.name} × {item.qty}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(item.price * item.qty, currency, locale)}
                  </span>
                </div>
              ))}
              <Separator />
              <SummaryRow
                label={t("shop.cart.subtotal")}
                value={formatMoney(cart.totals.subtotal, currency, locale)}
              />
              <SummaryRow
                label={t("shop.cart.shipping")}
                value={formatMoney(
                  selectedShipping?.price ?? cart.totals.shipping,
                  currency,
                  locale,
                )}
              />
              {cart.totals.discount > 0 ? (
                <SummaryRow
                  label={t("shop.cart.discount")}
                  value={`−${formatMoney(cart.totals.discount, currency, locale)}`}
                />
              ) : null}
              <SummaryRow
                label={t("shop.cart.tax")}
                value={formatMoney(cart.totals.tax, currency, locale)}
              />
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{t("shop.cart.total")}</span>
                <span className="tabular-nums">
                  {formatMoney(
                    cart.totals.subtotal +
                      (selectedShipping?.price ?? cart.totals.shipping) -
                      cart.totals.discount +
                      cart.totals.tax,
                    currency,
                    locale,
                  )}
                </span>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function ShippingCard({
  method,
  selected,
  currency,
}: {
  method: ShippingMethod;
  selected: boolean;
  currency: string;
}) {
  const locale = useLocale();
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
        selected
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:bg-accent/40",
      )}
    >
      <RadioGroupItem value={method.id} />
      <div className="flex-1">
        <div className="text-sm font-medium">{method.name}</div>
        <div className="text-xs text-muted-foreground">{method.eta}</div>
      </div>
      <span className="text-sm font-medium tabular-nums">
        {method.price === 0
          ? t("shop.checkout.free")
          : formatMoney(method.price, currency, locale)}
      </span>
    </label>
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

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground uppercase">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
