import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, ReceiptText } from "lucide-react";
import { useParams } from "react-router";

import { api } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { InvoiceSheet } from "@/features/shop/invoice-sheet";
import { t } from "@/lib/i18n";

/*
 * /shop/invoices/{id} (build-demo-screen-catalog): print-ready invoice rendered
 * through the shared InvoiceSheet. The header action calls window.print(); the
 * `.invoice-sheet` print rule (src/index.css) isolates the sheet.
 */

export function InvoiceDetailPage() {
  const { id } = useParams();
  const invoiceId = Number(id);

  const invoiceQuery = useQuery({
    queryKey: ["shop", "invoices", "detail", invoiceId],
    queryFn: () => api.invoices.get(invoiceId),
  });

  console.debug("[InvoiceDetailPage] load", { id: invoiceId });

  function print() {
    console.debug("[InvoiceDetailPage] print", { id: invoiceId });
    window.print();
  }

  if (invoiceQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("shop.invoices.detail.title")}
          icon={ReceiptText}
          breadcrumbs={[
            { label: t("nav.invoices"), href: "/shop/invoices" },
            { label: t("shop.invoices.detail.title") },
          ]}
        />
        <Panel>
          <EmptyState
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void invoiceQuery.refetch(),
            }}
          />
        </Panel>
      </div>
    );
  }

  const invoice = invoiceQuery.data;

  return (
    <div className="space-y-4">
      <PageHeader
        title={invoice?.number ?? t("shop.invoices.detail.title")}
        icon={ReceiptText}
        breadcrumbs={[
          { label: t("nav.invoices"), href: "/shop/invoices" },
          { label: invoice?.number ?? "…" },
        ]}
        secondaryActions={[
          {
            label: t("common.back"),
            href: "/shop/invoices",
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
          },
        ]}
        primaryAction={{
          label: t("shop.invoices.detail.print"),
          onClick: print,
          icon: <Printer />,
        }}
      />

      {invoiceQuery.isPending || !invoice ? (
        <Skeleton className="h-96" />
      ) : (
        <Panel className="invoice-sheet mx-auto max-w-3xl">
          <InvoiceSheet invoice={invoice} />
        </Panel>
      )}
    </div>
  );
}
