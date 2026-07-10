import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  type CompanyDetail,
  type CompanyListItem,
  type CompanyPayload,
} from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { SearchInput } from "@/components/toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /crm/companies — accounts directory with a detail drawer (profile, related
 * contacts + deals, notes) and an add dialog. Reachable with crm.companies.
 */

function CompanyLogo({ color, name }: { color: string; name: string }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-foreground/70"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

const schema = z.object({
  name: z.string().min(1, "required"),
  industry: z.string(),
  size: z.string(),
  owner: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function CrmCompaniesPage() {
  const locale = useLocale();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    sort:
      (params.sort?.column as
        | "name"
        | "deals_value"
        | "contacts_count"
        | undefined) ?? "name",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[CrmCompaniesPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["crm", "companies", filters],
    queryFn: () => api.crm.companies.list(filters),
    placeholderData: (previous) => previous,
  });
  const detailQuery = useQuery({
    queryKey: ["crm", "companies", "detail", selectedId],
    queryFn: () => api.crm.companies.get(selectedId!),
    enabled: selectedId !== null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", industry: "", size: "", owner: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CompanyPayload = { ...values };
      console.debug("[CrmCompaniesPage] create", payload);
      return api.crm.companies.create(payload);
    },
    onSuccess: () => {
      toast.success(t("crm.companies.created"));
      void queryClient.invalidateQueries({ queryKey: ["crm", "companies"] });
      setAddOpen(false);
      form.reset();
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<CompanyListItem>[]>(
    () => [
      {
        id: "name",
        header: t("crm.companies.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo color={row.original.logo_color} name={row.original.name} />
            <span className="truncate font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "industry",
        header: t("crm.companies.col.industry"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.industry}</span>
        ),
      },
      {
        id: "size",
        header: t("crm.companies.col.size"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.size}</span>
        ),
      },
      {
        id: "contacts_count",
        header: t("crm.companies.col.contacts"),
        meta: { sortable: true, className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.contacts_count}</span>
        ),
      },
      {
        id: "deals_value",
        header: t("crm.companies.col.deals_value"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatMoney(row.original.deals_value, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "owner",
        header: t("crm.companies.col.owner"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.owner}</span>
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<CompanyListItem>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (company) => setSelectedId(company.id),
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
      <PageHeader
        title={t("crm.companies.title")}
        icon={Building2}
        primaryAction={{
          label: t("crm.companies.add"),
          onClick: () => setAddOpen(true),
          permission: "crm.companies",
        }}
      />

      <Panel
        icon={Building2}
        title={t("crm.companies.title")}
        description={t("crm.companies.hint")}
        actions={
          <SearchInput
            value={params.search}
            onChange={params.setSearch}
            placeholder={t("crm.companies.search_placeholder")}
            className="w-56"
          />
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<CompanyListItem>
          label={t("crm.companies.title")}
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
            title: t("crm.companies.empty"),
            description: t("crm.companies.empty_hint"),
          }}
        />
      </Panel>

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {detailQuery.data ? (
            <CompanyDetailBody company={detailQuery.data} />
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              {t("common.loading")}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("crm.companies.add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField
              name="name"
              label={t("crm.companies.field.name")}
              required
              error={
                form.formState.errors.name && t("crm.companies.error.required")
              }
            >
              <Input id="name" {...form.register("name")} />
            </FormField>
            <FormField name="industry" label={t("crm.companies.field.industry")}>
              <Input id="industry" {...form.register("industry")} />
            </FormField>
            <FormField name="size" label={t("crm.companies.field.size")}>
              <Input id="size" {...form.register("size")} />
            </FormField>
            <FormField name="owner" label={t("crm.companies.field.owner")}>
              <Input id="owner" {...form.register("owner")} />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={form.handleSubmit((values) =>
                createMutation.mutate(values),
              )}
              disabled={createMutation.isPending}
            >
              {t("common.add")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyDetailBody({ company }: { company: CompanyDetail }) {
  const locale = useLocale();
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <CompanyLogo color={company.logo_color} name={company.name} />
          <div className="min-w-0">
            <SheetTitle className="truncate">{company.name}</SheetTitle>
            <SheetDescription className="truncate">
              {company.industry} · {company.size}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("crm.companies.col.owner")}
            </dt>
            <dd>{company.owner}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("crm.companies.col.deals_value")}
            </dt>
            <dd className="tabular-nums">
              {formatMoney(company.deals_value, company.currency, locale)}
            </dd>
          </div>
        </dl>

        {company.contacts.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("crm.companies.related_contacts")}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {company.contacts.map((contact) => (
                <li key={contact.id} className="text-muted-foreground">
                  {contact.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {company.deals.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("crm.companies.related_deals")}
            </h3>
            <ul className="space-y-2">
              {company.deals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{deal.title}</span>
                  <span className="tabular-nums">
                    {formatMoney(deal.value, company.currency, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {company.notes ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("crm.companies.notes")}
            </h3>
            <p className="text-sm text-muted-foreground">{company.notes}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
