import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, ValidationError, type DeliveryMethod } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /shop/delivery (build-demo-screen-catalog): a CRUD table of shipping methods.
 * Mirrors the discounts screen — a DataTable with a create/edit dialog
 * (react-hook-form + Zod) and a ConfirmDialog-gated delete, all on the mock store.
 */

const schema = z.object({
  name: z.string().min(1, "required"),
  zone: z.string().min(1, "required"),
  rate: z.number().min(0),
  eta_days: z.number().int().min(0),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function DeliveryPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<DeliveryMethod | null | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<DeliveryMethod | null>(null);

  const listQuery = useQuery({
    queryKey: ["shop", "delivery"],
    queryFn: api.delivery.list,
  });

  console.debug("[DeliveryPage] query", { count: listQuery.data?.length });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delivery.remove(id),
    onSuccess: () => {
      console.debug("[DeliveryPage] delete done");
      toast.success(t("shop.delivery.deleted"));
      void queryClient.invalidateQueries({ queryKey: ["shop", "delivery"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<DeliveryMethod>[]>(
    () => [
      {
        id: "name",
        header: t("shop.delivery.col.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "zone",
        header: t("shop.delivery.col.zone"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.zone}</span>
        ),
      },
      {
        id: "rate",
        header: t("shop.delivery.col.rate"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.rate === 0
              ? t("shop.delivery.free")
              : formatMoney(row.original.rate, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "eta",
        header: t("shop.delivery.col.eta"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {row.original.eta_days === 0
              ? t("shop.delivery.same_day")
              : t("shop.delivery.days", { count: row.original.eta_days })}
          </span>
        ),
      },
      {
        id: "active",
        header: t("shop.delivery.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.active ? "success" : "archived"}
            label={
              row.original.active
                ? t("shop.delivery.active")
                : t("shop.delivery.inactive")
            }
          />
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<DeliveryMethod>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      permission: "orders.delivery",
      onSelect: (method) => setEditing(method),
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      destructive: true,
      permission: "orders.delivery",
      onSelect: (method) => setDeleteTarget(method),
    },
  ];

  const rows = listQuery.data ?? [];
  const state = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.delivery")}
        icon={Truck}
        primaryAction={{
          label: t("shop.delivery.new"),
          icon: <Plus />,
          permission: "orders.delivery",
          onClick: () => setEditing(null),
        }}
      />

      <Panel contentClassName="p-2 sm:p-3">
        <DataTable<DeliveryMethod>
          columns={columns}
          data={rows}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("shop.delivery.empty"),
            description: t("shop.delivery.empty_hint"),
          }}
        />
      </Panel>

      <DeliveryDialog
        method={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          void queryClient.invalidateQueries({
            queryKey: ["shop", "delivery"],
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("shop.delivery.delete_confirm.title")}
        description={t("shop.delivery.delete_confirm.description", {
          name: deleteTarget?.name ?? "",
        })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}

function DeliveryDialog({
  method,
  onClose,
  onSaved,
}: {
  method: DeliveryMethod | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = method !== undefined;
  const isEdit = Boolean(method);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: method?.name ?? "",
      zone: method?.zone ?? "",
      rate: method?.rate ?? 0,
      eta_days: method?.eta_days ?? 3,
      active: method?.active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      console.debug("[DeliveryPage] submit", { id: method?.id, values });
      return method
        ? api.delivery.update(method.id, values)
        : api.delivery.create(values);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? t("shop.delivery.updated") : t("shop.delivery.created"),
      );
      onSaved();
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        for (const [field, code] of Object.entries(cause.fields)) {
          form.setError(field as keyof FormValues, { message: code });
        }
        return;
      }
      toast.error(t("common.request_failed"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("shop.delivery.edit") : t("shop.delivery.new")}
          </DialogTitle>
          <DialogDescription>
            {t("shop.delivery.dialog_hint")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="delivery-form"
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormField
            name="name"
            label={t("shop.delivery.col.name")}
            required
            error={
              form.formState.errors.name && t("shop.delivery.error.required")
            }
          >
            <Input id="name" {...form.register("name")} placeholder="Express" />
          </FormField>

          <FormField
            name="zone"
            label={t("shop.delivery.col.zone")}
            required
            error={
              form.formState.errors.zone && t("shop.delivery.error.required")
            }
          >
            <Input
              id="zone"
              {...form.register("zone")}
              placeholder="Domestic"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              name="rate"
              label={t("shop.delivery.col.rate")}
              help={t("shop.delivery.rate_hint")}
            >
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                {...form.register("rate", { valueAsNumber: true })}
              />
            </FormField>
            <FormField
              name="eta_days"
              label={t("shop.delivery.col.eta")}
              help={t("shop.delivery.eta_hint")}
            >
              <Input
                id="eta_days"
                type="number"
                min="0"
                {...form.register("eta_days", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <Controller
            control={form.control}
            name="active"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border border-border/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">
                    {t("shop.delivery.active_label")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("shop.delivery.active_hint")}
                  </p>
                </div>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-label={t("shop.delivery.active_label")}
                />
              </div>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="delivery-form"
            disabled={mutation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
