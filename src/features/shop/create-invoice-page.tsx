import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, ReceiptText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type InvoiceDetail, type InvoiceDraft } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { InvoiceSheet } from "@/features/shop/invoice-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/invoices/new — build a new invoice: a react-hook-form field-array on the
 * left (issuer, recipient, dynamic line items, tax, discount, notes) with a live
 * preview reusing InvoiceSheet on the right. Reachable with invoices.manage.
 */

const CURRENCY = "USD";

const schema = z.object({
  issuer_name: z.string().min(1, "required"),
  issuer_email: z.string(),
  issuer_address: z.string(),
  recipient_name: z.string().min(1, "required"),
  recipient_email: z.string(),
  recipient_address: z.string(),
  items: z
    .array(
      z.object({
        description: z.string().min(1, "required"),
        qty: z.number().min(1),
        price: z.number().min(0),
      }),
    )
    .min(1),
  tax_rate: z.number().min(0),
  discount: z.number().min(0),
  notes: z.string(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  issuer_name: "Air Glass Store, Inc.",
  issuer_email: "billing@airglass.example",
  issuer_address: "1 Glassway Ave\nSan Francisco, CA 94107",
  recipient_name: "",
  recipient_email: "",
  recipient_address: "",
  items: [{ description: "", qty: 1, price: 0 }],
  tax_rate: 8,
  discount: 0,
  notes: "Payment due within 14 days. Thank you for your business.",
};

function toPayload(values: FormValues): InvoiceDraft {
  return {
    issuer: {
      name: values.issuer_name,
      email: values.issuer_email,
      address: values.issuer_address,
    },
    recipient: {
      name: values.recipient_name,
      email: values.recipient_email,
      address: values.recipient_address,
    },
    items: values.items.map((item) => ({
      description: item.description,
      qty: item.qty,
      price: item.price,
    })),
    tax_rate: values.tax_rate,
    discount: values.discount,
    notes: values.notes,
  };
}

export function CreateInvoicePage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const printAfterSave = useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
    mode: "onChange",
  });
  const { register, control, handleSubmit, watch, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const values = watch();
  const preview = buildPreview(values);

  const saveMutation = useMutation({
    mutationFn: (payload: InvoiceDraft) => {
      console.debug("[CreateInvoicePage] save", payload);
      return api.invoices.create(payload);
    },
    onSuccess: (invoice) => {
      toast.success(t("shop.invoices.create.saved"));
      if (printAfterSave.current) {
        printAfterSave.current = false;
        window.print();
      }
      navigate(`/shop/invoices/${invoice.id}`);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const onSubmit = (formValues: FormValues) =>
    saveMutation.mutate(toPayload(formValues));

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("shop.invoices.create.title")}
        icon={ReceiptText}
        breadcrumbs={[
          { label: t("nav.invoices"), href: "/shop/invoices" },
          { label: t("shop.invoices.create.title") },
        ]}
        secondaryActions={[
          {
            label: t("shop.invoices.create.save_print"),
            onClick: () => {
              printAfterSave.current = true;
              void handleSubmit(onSubmit)();
            },
            disabled: saveMutation.isPending,
          },
        ]}
        primaryAction={{
          label: t("common.save"),
          onClick: () => void handleSubmit(onSubmit)(),
          disabled: saveMutation.isPending,
        }}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Panel title={t("shop.invoices.create.issuer")}>
            <div className="grid gap-4">
              <FormField
                name="issuer_name"
                label={t("shop.invoices.create.field.name")}
                required
                error={
                  formState.errors.issuer_name &&
                  t("shop.invoices.create.error.required")
                }
              >
                <Input id="issuer_name" {...register("issuer_name")} />
              </FormField>
              <FormField
                name="issuer_email"
                label={t("shop.invoices.create.field.email")}
              >
                <Input id="issuer_email" {...register("issuer_email")} />
              </FormField>
              <FormField
                name="issuer_address"
                label={t("shop.invoices.create.field.address")}
              >
                <Textarea
                  id="issuer_address"
                  rows={2}
                  {...register("issuer_address")}
                />
              </FormField>
            </div>
          </Panel>

          <Panel title={t("shop.invoices.create.recipient")}>
            <div className="grid gap-4">
              <FormField
                name="recipient_name"
                label={t("shop.invoices.create.field.name")}
                required
                error={
                  formState.errors.recipient_name &&
                  t("shop.invoices.create.error.required")
                }
              >
                <Input id="recipient_name" {...register("recipient_name")} />
              </FormField>
              <FormField
                name="recipient_email"
                label={t("shop.invoices.create.field.email")}
              >
                <Input id="recipient_email" {...register("recipient_email")} />
              </FormField>
              <FormField
                name="recipient_address"
                label={t("shop.invoices.create.field.address")}
              >
                <Textarea
                  id="recipient_address"
                  rows={2}
                  {...register("recipient_address")}
                />
              </FormField>
            </div>
          </Panel>

          <Panel
            title={t("shop.invoices.create.line_items")}
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => append({ description: "", qty: 1, price: 0 })}
              >
                <Plus />
                {t("shop.invoices.create.add_line")}
              </Button>
            }
          >
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_4rem_6rem_auto] gap-2 px-1 text-xs font-medium text-muted-foreground">
                <span>{t("shop.invoices.create.line.desc")}</span>
                <span>{t("shop.invoices.create.line.qty")}</span>
                <span>{t("shop.invoices.create.line.price")}</span>
                <span className="w-[6.5rem] text-end">
                  {t("shop.cart.col.total")}
                </span>
              </div>
              {fields.map((field, index) => {
                const line = values.items?.[index];
                const lineTotal = (line?.qty ?? 0) * (line?.price ?? 0);
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_4rem_6rem_auto] items-center gap-2"
                  >
                    <Input
                      aria-label={t("shop.invoices.create.line.desc")}
                      {...register(`items.${index}.description`)}
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      aria-label={t("shop.invoices.create.line.qty")}
                      {...register(`items.${index}.qty`, {
                        valueAsNumber: true,
                      })}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={t("shop.invoices.create.line.price")}
                      {...register(`items.${index}.price`, {
                        valueAsNumber: true,
                      })}
                    />
                    <div className="flex items-center gap-1">
                      <span className="w-16 text-end text-sm tabular-nums">
                        {formatMoney(lineTotal, CURRENCY, locale)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t("common.delete")}
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                name="tax_rate"
                label={t("shop.invoices.create.field.tax_rate")}
              >
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  step="0.1"
                  {...register("tax_rate", { valueAsNumber: true })}
                />
              </FormField>
              <FormField
                name="discount"
                label={t("shop.invoices.create.field.discount")}
              >
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("discount", { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <FormField
              name="notes"
              label={t("shop.invoices.create.field.notes")}
              className="mt-4"
            >
              <Textarea id="notes" rows={2} {...register("notes")} />
            </FormField>
          </Panel>
        </div>

        <Panel
          title={t("shop.invoices.create.preview")}
          className="invoice-sheet lg:sticky lg:top-4"
        >
          <InvoiceSheet invoice={preview} />
        </Panel>
      </div>
    </div>
  );
}

function buildPreview(values: FormValues): InvoiceDetail {
  const items = (values.items ?? []).map((item, index) => ({
    id: index + 1,
    name: item.description || "—",
    sku: "—",
    qty: Number(item.qty) || 0,
    price: Number(item.price) || 0,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Number(values.discount) || 0;
  const tax = (subtotal - discount) * ((Number(values.tax_rate) || 0) / 100);
  const total = Math.max(0, subtotal - discount + tax);
  const now = new Date();
  return {
    id: 0,
    number: "INV-2026-PREVIEW",
    customer_name: values.recipient_name || "—",
    issued_at: now.toISOString(),
    due_at: new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString(),
    amount: total,
    currency: CURRENCY,
    status: "draft",
    issuer: {
      name: values.issuer_name || "—",
      email: values.issuer_email,
      address: values.issuer_address,
    },
    recipient: {
      name: values.recipient_name || "—",
      email: values.recipient_email,
      address: values.recipient_address,
    },
    items,
    totals: { subtotal, shipping: 0, discount, tax, total },
    notes: values.notes,
  };
}
