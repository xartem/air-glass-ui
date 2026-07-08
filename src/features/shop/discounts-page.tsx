import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Percent, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  ValidationError,
  type Discount,
  type DiscountStatus,
  type DiscountType,
} from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
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

/*
 * /shop/discounts (build-demo-screen-catalog): a CRUD table of discount codes.
 * A DataTable lists codes with a create/edit dialog (react-hook-form + Zod) and
 * a ConfirmDialog-gated delete. Everything runs on the mock store.
 */

const STATUS_KIND: Record<DiscountStatus, StatusKind> = {
  active: "success",
  scheduled: "pending",
  expired: "archived",
  disabled: "error",
};

const TYPES: DiscountType[] = ["percent", "fixed"];
const STATUSES: DiscountStatus[] = [
  "active",
  "scheduled",
  "expired",
  "disabled",
];

const schema = z.object({
  code: z.string().min(1, "required"),
  type: z.enum(["percent", "fixed"]),
  value: z.number().min(0),
  usage_limit: z.number().int().min(0).nullable(),
  status: z.enum(["active", "scheduled", "expired", "disabled"]),
  expires_at: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function DiscountsPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Discount | null | undefined>(
    undefined,
  ); // undefined = closed, null = create
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);

  const listQuery = useQuery({
    queryKey: ["shop", "discounts"],
    queryFn: api.discounts.list,
  });

  console.debug("[DiscountsPage] query", { count: listQuery.data?.length });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.discounts.remove(id),
    onSuccess: () => {
      console.debug("[DiscountsPage] delete done");
      toast.success(t("shop.discounts.deleted"));
      void queryClient.invalidateQueries({ queryKey: ["shop", "discounts"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<Discount>[]>(
    () => [
      {
        id: "code",
        header: t("shop.discounts.col.code"),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{row.original.code}</span>
        ),
      },
      {
        id: "type",
        header: t("shop.discounts.col.type"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span>{t(`shop.discounts.type.${row.original.type}`)}</span>
        ),
      },
      {
        id: "value",
        header: t("shop.discounts.col.value"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {row.original.type === "percent"
              ? `${row.original.value}%`
              : formatMoney(row.original.value, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: "usage",
        header: t("shop.discounts.col.usage"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.used}
            {row.original.usage_limit !== null
              ? ` / ${row.original.usage_limit}`
              : ""}
          </span>
        ),
      },
      {
        id: "status",
        header: t("shop.discounts.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.discounts.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: "expires_at",
        header: t("shop.discounts.col.expires"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground tabular-nums">
            {row.original.expires_at
              ? new Date(row.original.expires_at).toLocaleDateString(locale)
              : t("shop.discounts.never")}
          </span>
        ),
      },
    ],
    [locale],
  );

  const rowActions: RowAction<Discount>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      permission: "orders.discounts",
      onSelect: (discount) => setEditing(discount),
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      destructive: true,
      permission: "orders.discounts",
      onSelect: (discount) => setDeleteTarget(discount),
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
        title={t("nav.discounts")}
        icon={Percent}
        primaryAction={{
          label: t("shop.discounts.new"),
          icon: <Plus />,
          permission: "orders.discounts",
          onClick: () => setEditing(null),
        }}
      />

      <Panel contentClassName="p-2 sm:p-3">
        <DataTable<Discount>
          columns={columns}
          data={rows}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("shop.discounts.empty"),
            description: t("shop.discounts.empty_hint"),
          }}
        />
      </Panel>

      <DiscountDialog
        discount={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          void queryClient.invalidateQueries({
            queryKey: ["shop", "discounts"],
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("shop.discounts.delete_confirm.title")}
        description={t("shop.discounts.delete_confirm.description", {
          code: deleteTarget?.code ?? "",
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

function DiscountDialog({
  discount,
  onClose,
  onSaved,
}: {
  discount: Discount | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = discount !== undefined;
  const isEdit = Boolean(discount);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    // Re-seed defaults each time the dialog opens for a different row.
    values: {
      code: discount?.code ?? "",
      type: discount?.type ?? "percent",
      value: discount?.value ?? 10,
      usage_limit: discount?.usage_limit ?? null,
      status: discount?.status ?? "active",
      expires_at: discount?.expires_at ?? null,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      console.debug("[DiscountsPage] submit", { id: discount?.id, values });
      return discount
        ? api.discounts.update(discount.id, values)
        : api.discounts.create(values);
    },
    onSuccess: () => {
      toast.success(
        isEdit ? t("shop.discounts.updated") : t("shop.discounts.created"),
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
            {isEdit ? t("shop.discounts.edit") : t("shop.discounts.new")}
          </DialogTitle>
          <DialogDescription>
            {t("shop.discounts.dialog_hint")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="discount-form"
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormField
            name="code"
            label={t("shop.discounts.col.code")}
            required
            error={
              form.formState.errors.code && t("shop.discounts.error.required")
            }
          >
            <Input
              id="code"
              {...form.register("code")}
              placeholder="SUMMER25"
              className="uppercase"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormField name="type" label={t("shop.discounts.col.type")}>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`shop.discounts.type.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <FormField
              name="value"
              label={t("shop.discounts.col.value")}
              required
            >
              <Input
                id="value"
                type="number"
                step="0.01"
                min="0"
                {...form.register("value", { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormField name="status" label={t("shop.discounts.col.status")}>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {t(`shop.discounts.status.${status}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              )}
            />
            <Controller
              control={form.control}
              name="usage_limit"
              render={({ field }) => (
                <FormField
                  name="usage_limit"
                  label={t("shop.discounts.col.limit")}
                  help={t("shop.discounts.limit_hint")}
                >
                  <Input
                    id="usage_limit"
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      )
                    }
                  />
                </FormField>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormField
                name="expires_at"
                label={t("shop.discounts.col.expires")}
                help={t("shop.discounts.expires_hint")}
              >
                <Input
                  id="expires_at"
                  type="date"
                  value={field.value ? field.value.slice(0, 10) : ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value
                        ? new Date(event.target.value).toISOString()
                        : null,
                    )
                  }
                />
              </FormField>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="discount-form"
            disabled={mutation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
