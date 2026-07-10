import { format } from "date-fns";
import { de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";

import type { InvoiceDetail, InvoiceStatus } from "@/api";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
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
 * Printable invoice sheet — the shared layout for the invoice detail view and
 * the create-invoice live preview. Token-only; the `.invoice-sheet` print rule
 * (src/index.css) isolates it for printing.
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
};

const STATUS_KIND: Record<InvoiceStatus, StatusKind> = {
  paid: "success",
  overdue: "error",
  draft: "pending",
  sent: "info",
};

export function InvoiceSheet({ invoice }: { invoice: InvoiceDetail }) {
  const locale = useLocale();
  return (
    <div className="space-y-8 p-2 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("shop.invoices.detail.title")}
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {invoice.number}
          </div>
        </div>
        <StatusBadge
          status={STATUS_KIND[invoice.status]}
          label={t(`shop.invoices.status.${invoice.status}`)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {t("shop.invoices.detail.from")}
          </div>
          <div className="mt-1 text-sm font-medium">{invoice.issuer.name}</div>
          <div className="text-sm text-muted-foreground">
            {invoice.issuer.email}
          </div>
          <div className="whitespace-pre-line text-sm text-muted-foreground">
            {invoice.issuer.address}
          </div>
        </div>
        <div className="sm:text-end">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {t("shop.invoices.detail.to")}
          </div>
          <div className="mt-1 text-sm font-medium">
            {invoice.recipient.name}
          </div>
          <div className="text-sm text-muted-foreground">
            {invoice.recipient.email}
          </div>
          <div className="whitespace-pre-line text-sm text-muted-foreground">
            {invoice.recipient.address}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">
            {t("shop.invoices.col.issued")}:{" "}
          </span>
          {format(new Date(invoice.issued_at), "PP", {
            locale: DATE_LOCALES[locale],
          })}
        </div>
        <div>
          <span className="text-muted-foreground">
            {t("shop.invoices.col.due")}:{" "}
          </span>
          {format(new Date(invoice.due_at), "PP", {
            locale: DATE_LOCALES[locale],
          })}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shop.orders.detail.item")}</TableHead>
            <TableHead className="text-end">
              {t("shop.orders.detail.qty")}
            </TableHead>
            <TableHead className="text-end">
              {t("shop.orders.detail.price")}
            </TableHead>
            <TableHead className="text-end">
              {t("shop.orders.detail.subtotal")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoice.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {item.sku && item.sku !== "—" ? (
                  <div className="text-xs text-muted-foreground">
                    {item.sku}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-end tabular-nums">{item.qty}</TableCell>
              <TableCell className="text-end tabular-nums">
                {formatMoney(item.price, invoice.currency, locale)}
              </TableCell>
              <TableCell className="text-end tabular-nums">
                {formatMoney(item.price * item.qty, invoice.currency, locale)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{t("shop.orders.detail.subtotal")}</span>
            <span className="tabular-nums text-foreground">
              {formatMoney(invoice.totals.subtotal, invoice.currency, locale)}
            </span>
          </div>
          {invoice.totals.discount > 0 ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t("shop.orders.detail.discount")}</span>
              <span className="tabular-nums text-foreground">
                {`− ${formatMoney(invoice.totals.discount, invoice.currency, locale)}`}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between text-muted-foreground">
            <span>{t("shop.orders.detail.tax")}</span>
            <span className="tabular-nums text-foreground">
              {formatMoney(invoice.totals.tax, invoice.currency, locale)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>{t("shop.orders.detail.total")}</span>
            <span className="tabular-nums">
              {formatMoney(invoice.totals.total, invoice.currency, locale)}
            </span>
          </div>
        </dl>
      </div>

      {invoice.notes ? (
        <div className="border-t pt-4 text-sm text-muted-foreground">
          {invoice.notes}
        </div>
      ) : null}
    </div>
  );
}
