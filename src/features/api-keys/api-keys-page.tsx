import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type ApiKey, type ApiKeyScope } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { FormField } from "@/components/form-field";
import { MultiSelect } from "@/components/multi-select";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";

/*
 * /api-keys — API credential management: masked key table, scoped create
 * dialog and a reveal-once secret modal. Revoking asks for confirmation.
 * Reachable with apikeys.view; create/revoke need apikeys.manage.
 */

const SCOPES: ApiKeyScope[] = ["read", "write", "admin", "billing"];

const schema = z.object({
  name: z.string().trim().min(1),
  scopes: z.array(z.enum(["read", "write", "admin", "billing"])).min(1),
});
type FormValues = z.infer<typeof schema>;

export function ApiKeysPage() {
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);

  const key = ["apikeys"];
  const listQuery = useQuery({
    queryKey: key,
    queryFn: () => api.apikeys.list(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", scopes: ["read"] },
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => {
      console.debug("[ApiKeysPage] create", values);
      return api.apikeys.create(values);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: key });
      setCreateOpen(false);
      form.reset();
      setSecretCopied(false);
      setSecret(created.secret);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[ApiKeysPage] revoke", id);
      return api.apikeys.revoke(id);
    },
    onSuccess: () => {
      toast.success(t("apikeys.revoked"));
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: () => toast.error(t("common.request_failed")),
    onSettled: () => setRevokeTarget(null),
  });

  const copyMasked = (masked: string) => {
    void navigator.clipboard?.writeText(masked);
    toast.success(t("apikeys.copied"));
  };

  const columns = useMemo<ColumnDef<ApiKey>[]>(
    () => [
      {
        id: "name",
        header: t("apikeys.col.name"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "key",
        header: t("apikeys.col.key"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs">
              {row.original.masked_key}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={() => copyMasked(row.original.masked_key)}
              aria-label={t("apikeys.copy")}
            >
              <Copy className="size-3.5" />
            </Button>
          </span>
        ),
      },
      {
        id: "scopes",
        header: t("apikeys.col.scopes"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.scopes.map((scope) => (
              <Badge key={scope} variant="secondary">
                {t(`apikeys.scope.${scope}`)}
              </Badge>
            ))}
          </span>
        ),
      },
      {
        id: "created_at",
        header: t("apikeys.col.created"),
        meta: { className: "max-sm:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "last_used_at",
        header: t("apikeys.col.last_used"),
        meta: { className: "max-lg:hidden" },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.last_used_at
              ? dt.format(row.original.last_used_at)
              : t("apikeys.never_used")}
          </span>
        ),
      },
      {
        id: "status",
        header: t("apikeys.col.status"),
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status === "active" ? "success" : "archived"}
            label={t(`apikeys.status.${row.original.status}`)}
          />
        ),
      },
    ],
    [dt],
  );

  const rowActions: RowAction<ApiKey>[] = [
    {
      key: "revoke",
      label: t("apikeys.revoke"),
      destructive: true,
      permission: "apikeys.manage",
      onSelect: (entry) => setRevokeTarget(entry),
      hidden: (entry) => entry.status !== "active",
    },
  ];

  const data = listQuery.data;
  const state = listQuery.isPending
    ? "loading"
    : listQuery.isError
      ? "error"
      : (data?.length ?? 0) === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.apiKeys")}
        icon={KeyRound}
        primaryAction={{
          label: t("apikeys.create"),
          onClick: () => setCreateOpen(true),
          permission: "apikeys.manage",
        }}
      />

      <Panel>
        <p className="text-sm text-muted-foreground">{t("apikeys.intro")}</p>
      </Panel>

      <Panel
        icon={KeyRound}
        title={t("nav.apiKeys")}
        description={t("apikeys.hint")}
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<ApiKey>
          label={t("nav.apiKeys")}
          columns={columns}
          data={data ?? []}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("apikeys.empty"),
            description: t("apikeys.empty_hint"),
          }}
        />
      </Panel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("apikeys.create")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <FormField
              name="name"
              label={t("apikeys.field.name")}
              required
              error={form.formState.errors.name && t("apikeys.error.required")}
            >
              <Input id="name" {...form.register("name")} />
            </FormField>
            <FormField
              name="scopes"
              label={t("apikeys.field.scopes")}
              required
              error={form.formState.errors.scopes && t("apikeys.error.scopes")}
            >
              <MultiSelect
                options={SCOPES.map((scope) => ({
                  value: scope,
                  label: t(`apikeys.scope.${scope}`),
                }))}
                value={form.watch("scopes")}
                onChange={(value) =>
                  form.setValue("scopes", value as ApiKeyScope[], {
                    shouldValidate: true,
                  })
                }
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
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

      <Dialog
        open={secret !== null}
        onOpenChange={(open) => {
          if (!open) setSecret(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("apikeys.secret.title")}</DialogTitle>
            <DialogDescription>{t("apikeys.secret.hint")}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs">
              {secret}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                if (secret) void navigator.clipboard?.writeText(secret);
                setSecretCopied(true);
                toast.success(t("apikeys.copied"));
              }}
              aria-label={t("apikeys.copy")}
            >
              {secretCopied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecret(null)}>
              {t("apikeys.secret.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title={t("apikeys.revoke_title")}
        description={t("apikeys.revoke_confirm", {
          name: revokeTarget?.name ?? "",
        })}
        confirmLabel={t("apikeys.revoke")}
        destructive
        onConfirm={() => {
          if (revokeTarget) revokeMutation.mutate(revokeTarget.id);
        }}
      />
    </div>
  );
}
