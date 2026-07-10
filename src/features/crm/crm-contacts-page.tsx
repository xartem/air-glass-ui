import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Contact, Mail, Phone } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  type CrmContactDetail,
  type CrmContactPayload,
} from "@/api";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { SearchInput } from "@/components/toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineIndicator,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { toast } from "sonner";
import { useSiteDateTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useListParams } from "@/lib/list-params";
import { useLocale } from "@/lib/use-locale";

/*
 * /crm/contacts — relationship directory (distinct from the CMS /contacts inbox).
 * Table + a detail drawer (profile, activity timeline, related deals) and an add
 * dialog. Reachable with contacts.view.
 */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const schema = z.object({
  name: z.string().min(1, "required"),
  company: z.string(),
  email: z.string(),
  phone: z.string(),
  owner: z.string(),
});
type FormValues = z.infer<typeof schema>;

export function CrmContactsPage() {
  const dt = useSiteDateTime();
  const params = useListParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const filters = {
    page: params.page,
    q: params.query || undefined,
    sort:
      (params.sort?.column as "name" | "company" | "last_activity" | undefined) ??
      "name",
    dir: params.sort?.dir ?? ("asc" as const),
  };

  console.debug("[CrmContactsPage] query", filters);

  const listQuery = useQuery({
    queryKey: ["crm", "contacts", filters],
    queryFn: () => api.crm.contacts.list(filters),
    placeholderData: (previous) => previous,
  });

  const detailQuery = useQuery({
    queryKey: ["crm", "contacts", "detail", selectedId],
    queryFn: () => api.crm.contacts.get(selectedId!),
    enabled: selectedId !== null,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", company: "", email: "", phone: "", owner: "" },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: CrmContactPayload = { ...values, tags: [] };
      console.debug("[CrmContactsPage] create", payload);
      return api.crm.contacts.create(payload);
    },
    onSuccess: () => {
      toast.success(t("crm.contacts.created"));
      void queryClient.invalidateQueries({ queryKey: ["crm", "contacts"] });
      setAddOpen(false);
      form.reset();
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<CrmContactDetail>[]>(
    () => [
      {
        id: "name",
        header: t("crm.contacts.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "company",
        header: t("crm.contacts.col.company"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.company}</span>
        ),
      },
      {
        id: "email",
        header: t("crm.contacts.col.email"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "tags",
        header: t("crm.contacts.col.tags"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: "owner",
        header: t("crm.contacts.col.owner"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.owner}</span>
        ),
      },
      {
        id: "last_activity",
        header: t("crm.contacts.col.last_activity"),
        meta: { sortable: true, className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.last_activity)}
          </span>
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<CrmContactDetail>[] = [
    {
      key: "open",
      label: t("common.view"),
      onSelect: (contact) => setSelectedId(contact.id),
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
        title={t("crm.contacts.title")}
        icon={Contact}
        primaryAction={{
          label: t("crm.contacts.add"),
          onClick: () => setAddOpen(true),
          permission: "contacts.view",
        }}
      />

      <Panel
        icon={Contact}
        title={t("crm.contacts.title")}
        description={t("crm.contacts.hint")}
        actions={
          <SearchInput
            value={params.search}
            onChange={params.setSearch}
            placeholder={t("crm.contacts.search_placeholder")}
            className="w-56"
          />
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<CrmContactDetail>
          label={t("crm.contacts.title")}
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
            title: t("crm.contacts.empty"),
            description: t("crm.contacts.empty_hint"),
          }}
        />
      </Panel>

      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {detailQuery.data ? (
            <ContactDetailBody contact={detailQuery.data} />
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
            <DialogTitle>{t("crm.contacts.add")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField
              name="name"
              label={t("crm.contacts.field.name")}
              required
              error={form.formState.errors.name && t("crm.contacts.error.required")}
            >
              <Input id="name" {...form.register("name")} />
            </FormField>
            <FormField name="company" label={t("crm.contacts.field.company")}>
              <Input id="company" {...form.register("company")} />
            </FormField>
            <FormField name="email" label={t("crm.contacts.field.email")}>
              <Input id="email" {...form.register("email")} />
            </FormField>
            <FormField name="phone" label={t("crm.contacts.field.phone")}>
              <Input id="phone" {...form.register("phone")} />
            </FormField>
            <FormField name="owner" label={t("crm.contacts.field.owner")}>
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

function ContactDetailBody({ contact }: { contact: CrmContactDetail }) {
  const dt = useSiteDateTime();
  const locale = useLocale();
  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{initials(contact.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle className="truncate">{contact.name}</SheetTitle>
            <SheetDescription className="truncate">
              {contact.company}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-6">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Mail /> {t("crm.contacts.email_action")}
          </Button>
          <Button variant="outline" size="sm">
            <Phone /> {t("crm.contacts.call_action")}
          </Button>
        </div>

        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("crm.contacts.field.email")}
            </dt>
            <dd>{contact.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("crm.contacts.field.phone")}
            </dt>
            <dd>{contact.phone}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">
              {t("crm.contacts.field.owner")}
            </dt>
            <dd>{contact.owner}</dd>
          </div>
        </dl>

        {contact.deals.length > 0 ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">
              {t("crm.contacts.related_deals")}
            </h3>
            <ul className="space-y-2">
              {contact.deals.map((deal) => (
                <li
                  key={deal.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">{deal.title}</span>
                  <span className="tabular-nums">
                    {formatMoney(deal.value, "USD", locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <h3 className="mb-2 text-sm font-semibold">
            {t("crm.contacts.activity")}
          </h3>
          <Timeline>
            {contact.activity.map((entry) => (
              <TimelineItem key={entry.id}>
                <TimelineIndicator variant="info" />
                <TimelineConnector />
                <TimelineContent>
                  <TimelineTitle>{entry.text}</TimelineTitle>
                  <TimelineTime>{dt.format(entry.at)}</TimelineTime>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </div>
    </>
  );
}
