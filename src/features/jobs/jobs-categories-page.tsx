import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, ValidationError, type JobCategory } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
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
import { t } from "@/lib/i18n";

/*
 * /jobs/categories — CRUD over job categories: a DataTable with a create/edit
 * dialog (react-hook-form + Zod) and a ConfirmDialog-gated delete, all on the
 * mock store. Reachable with jobs.manage.
 */

const schema = z.object({
  name: z.string().min(1, "required"),
  slug: z
    .string()
    .min(1, "required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "invalid"),
});
type FormValues = z.infer<typeof schema>;

export function JobsCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<JobCategory | null | undefined>(
    undefined,
  ); // undefined = closed, null = create
  const [deleteTarget, setDeleteTarget] = useState<JobCategory | null>(null);

  const listQuery = useQuery({
    queryKey: ["jobs", "categories"],
    queryFn: api.jobs.categories,
  });

  console.debug("[JobsCategories] query", { count: listQuery.data?.length });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.jobs.deleteCategory(id),
    onSuccess: () => {
      toast.success(t("jobs.categories.deleted"));
      void queryClient.invalidateQueries({ queryKey: ["jobs", "categories"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<JobCategory>[]>(
    () => [
      {
        id: "name",
        header: t("jobs.categories.col.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "slug",
        header: t("jobs.categories.col.slug"),
        cell: ({ row }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            {row.original.slug}
          </code>
        ),
      },
      {
        id: "jobs_count",
        header: t("jobs.categories.col.count"),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.jobs_count}
          </span>
        ),
      },
    ],
    [],
  );

  const rowActions: RowAction<JobCategory>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      permission: "jobs.manage",
      onSelect: (category) => setEditing(category),
    },
    {
      key: "delete",
      label: t("common.delete"),
      icon: <Trash2 />,
      destructive: true,
      permission: "jobs.manage",
      onSelect: (category) => setDeleteTarget(category),
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
        title={t("jobs.categories.title")}
        icon={FolderTree}
        primaryAction={{
          label: t("jobs.categories.new"),
          icon: <Plus />,
          permission: "jobs.manage",
          onClick: () => setEditing(null),
        }}
      />

      <Panel contentClassName="p-2 sm:p-3">
        <DataTable<JobCategory>
          label={t("jobs.categories.title")}
          columns={columns}
          data={rows}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("jobs.categories.empty"),
            description: t("jobs.categories.empty_hint"),
          }}
        />
      </Panel>

      <CategoryDialog
        category={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined);
          void queryClient.invalidateQueries({
            queryKey: ["jobs", "categories"],
          });
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("jobs.categories.delete_confirm.title")}
        description={t("jobs.categories.delete_confirm.description", {
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

function CategoryDialog({
  category,
  onClose,
  onSaved,
}: {
  category: JobCategory | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = category !== undefined;
  const isEdit = Boolean(category);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      console.debug("[JobsCategories] submit", { id: category?.id, values });
      return api.jobs.saveCategory({ id: category?.id, ...values });
    },
    onSuccess: () => {
      toast.success(
        isEdit ? t("jobs.categories.updated") : t("jobs.categories.created"),
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
            {isEdit ? t("jobs.categories.edit") : t("jobs.categories.new")}
          </DialogTitle>
          <DialogDescription>
            {t("jobs.categories.dialog_hint")}
          </DialogDescription>
        </DialogHeader>

        <form
          id="job-category-form"
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <FormField
            name="name"
            label={t("jobs.categories.col.name")}
            required
            error={
              form.formState.errors.name && t("jobs.categories.error.required")
            }
          >
            <Input id="name" {...form.register("name")} />
          </FormField>
          <FormField
            name="slug"
            label={t("jobs.categories.col.slug")}
            required
            help={t("jobs.categories.slug_hint")}
            error={
              form.formState.errors.slug &&
              (form.formState.errors.slug.message === "duplicate"
                ? t("jobs.categories.error.duplicate")
                : t("jobs.categories.error.slug"))
            }
          >
            <Input
              id="slug"
              {...form.register("slug")}
              placeholder="engineering"
            />
          </FormField>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form="job-category-form"
            disabled={mutation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
