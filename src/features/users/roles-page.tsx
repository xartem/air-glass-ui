import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { api, ApiError, ValidationError, type RoleDetail } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { RoleMatrix, type RolePermissionMap } from "@/components/role-matrix";
import { SaveBar } from "@/components/save-bar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { useCan } from "@/lib/permissions";

/*
 * /roles (UI:users-roles §2): the role × permission matrix. Checkbox edits
 * accumulate as overrides on top of the loaded sets; SaveBar batches one PUT
 * per changed role (D:users §4 syncPermissions). Roles are created/renamed/
 * deleted via dialogs; a role that still has users can't be deleted (422 →
 * link to the filtered user list).
 */

function sortedKey(keys: string[]): string {
  return [...keys].sort().join(",");
}

export function RolesPage() {
  const queryClient = useQueryClient();
  const canManageDashboard = useCan("dashboard.manage");
  const [roles, permissions] = useQueries({
    queries: [
      { queryKey: ["roles"], queryFn: api.roles.all, staleTime: 30_000 },
      {
        queryKey: ["roles", "permissions"],
        queryFn: api.roles.permissions,
        staleTime: 5 * 60_000,
      },
    ],
  });

  const [edits, setEdits] = useState<RolePermissionMap>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RoleDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleDetail | null>(null);
  const [blockedRole, setBlockedRole] = useState<RoleDetail | null>(null);

  const roleList = roles.data ?? [];
  const initial = useMemo<RolePermissionMap>(
    () =>
      Object.fromEntries(roleList.map((role) => [role.id, role.permissions])),
    [roleList],
  );

  const value = useMemo<RolePermissionMap>(() => {
    const merged: RolePermissionMap = {};
    for (const role of roleList)
      merged[role.id] = edits[role.id] ?? initial[role.id] ?? [];
    return merged;
  }, [roleList, edits, initial]);

  const changedRoleIds = useMemo(
    () =>
      Object.keys(edits)
        .map(Number)
        .filter((id) => sortedKey(edits[id]) !== sortedKey(initial[id] ?? [])),
    [edits, initial],
  );
  const dirty = changedRoleIds.length > 0;

  const saveMutation = useMutation({
    mutationFn: () =>
      Promise.all(
        changedRoleIds.map((id) => api.roles.savePermissions(id, value[id])),
      ),
    onSuccess: async () => {
      setEdits({});
      toast.success(t("roles.saved"));
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.roles.remove(id),
    onSuccess: async () => {
      toast.success(t("roles.deleted"));
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (cause, id) => {
      if (cause instanceof ApiError && cause.code === "role_has_users") {
        setBlockedRole(roleList.find((role) => role.id === id) ?? null);
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  const loading = roles.isPending || permissions.isPending;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.roles")}
        icon={ShieldCheck}
        primaryAction={{
          label: t("roles.add"),
          onClick: () => setCreateOpen(true),
          permission: "roles.manage",
        }}
      />

      <Panel
        icon={ShieldCheck}
        title={t("nav.roles")}
        description={t("roles.hint")}
        contentClassName="p-0"
      >
        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <RoleMatrix
            roles={roleList}
            permissions={permissions.data ?? []}
            value={value}
            onChange={(roleId, keys) =>
              setEdits((current) => ({ ...current, [roleId]: keys }))
            }
            renderRoleMenu={(role) => {
              // System roles only get the dashboard entry; rename/delete stay non-system (UI:users-roles §2).
              if (role.is_system && !canManageDashboard) return null;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("common.actions")}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canManageDashboard ? (
                      <DropdownMenuItem asChild>
                        <Link to={`/?customize=${role.key}`}>
                          <LayoutDashboard />
                          {t("roles.customize_dashboard")}
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                    {!role.is_system ? (
                      <>
                        <DropdownMenuItem
                          onSelect={() => setRenameTarget(role)}
                        >
                          <Pencil />
                          {t("roles.rename")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteTarget(role)}
                        >
                          <Trash2 />
                          {t("common.delete")}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }}
          />
        )}
      </Panel>

      <SaveBar
        dirty={dirty}
        saving={saveMutation.isPending}
        onSave={() => saveMutation.mutate()}
        onReset={() => setEdits({})}
      />

      <CreateRoleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roles={roleList}
        onCreated={() =>
          void queryClient.invalidateQueries({ queryKey: ["roles"] })
        }
      />

      <RenameRoleDialog
        role={renameTarget}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        onRenamed={() =>
          void queryClient.invalidateQueries({ queryKey: ["roles"] })
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t("roles.delete_title", { label: deleteTarget?.label ?? "" })}
        description={t("roles.delete_description")}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      {/* Role still has users → cannot delete; offer to reassign them (UI:users-roles §2) */}
      <Dialog
        open={blockedRole !== null}
        onOpenChange={(open) => !open && setBlockedRole(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("roles.delete_blocked_title")}</DialogTitle>
            <DialogDescription>
              {t("roles.delete_has_users", {
                count: blockedRole?.users_count ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBlockedRole(null)}>
              {t("common.close")}
            </Button>
            <Button asChild onClick={() => setBlockedRole(null)}>
              <Link to={`/users?role=${blockedRole?.key ?? ""}`}>
                {t("roles.delete_reassign")}
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
  roles,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleDetail[];
  onCreated: () => void;
}) {
  const [key, setKey] = useState("");
  const [label, setLabel] = useState("");
  const [copyFrom, setCopyFrom] = useState<string>("none");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: () =>
      api.roles.create({
        key,
        label,
        copy_from_id: copyFrom === "none" ? undefined : Number(copyFrom),
      }),
    onSuccess: () => {
      toast.success(t("roles.created"));
      onCreated();
      onOpenChange(false);
      setKey("");
      setLabel("");
      setCopyFrom("none");
      setErrors({});
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        setErrors(
          Object.fromEntries(
            Object.entries(cause.fields).map(([field, code]) => [
              field,
              t(`roles.error.${code}`),
            ]),
          ),
        );
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roles.add")}</DialogTitle>
          <DialogDescription>{t("roles.add_hint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            name="role-key"
            label={t("roles.field.key")}
            required
            help={t("roles.field.key_hint")}
            error={errors.key}
          >
            <Input
              id="role-key"
              value={key}
              className="font-mono"
              onChange={(event) => setKey(event.target.value.toLowerCase())}
            />
          </FormField>
          <FormField
            name="role-label"
            label={t("roles.field.label")}
            required
            error={errors.label}
          >
            <Input
              id="role-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </FormField>
          <FormField name="role-copy" label={t("roles.field.copy_from")}>
            <Select value={copyFrom} onValueChange={setCopyFrom}>
              <SelectTrigger id="role-copy" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("roles.copy_none")}</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={String(role.id)}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RenameRoleDialog({
  role,
  onOpenChange,
  onRenamed,
}: {
  role: RoleDetail | null;
  onOpenChange: (open: boolean) => void;
  onRenamed: () => void;
}) {
  const [label, setLabel] = useState("");

  // Seed the field when a role is selected (controlled open won't fire onOpenChange).
  useEffect(() => {
    if (role) setLabel(role.label);
  }, [role]);

  const mutation = useMutation({
    mutationFn: () => api.roles.rename(role!.id, label),
    onSuccess: () => {
      toast.success(t("roles.renamed"));
      onRenamed();
      onOpenChange(false);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("roles.rename")}</DialogTitle>
          <DialogDescription>
            {t("roles.rename_hint", { key: role?.key ?? "" })}
          </DialogDescription>
        </DialogHeader>
        <FormField name="rename-label" label={t("roles.field.label")} required>
          <Input
            id="rename-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </FormField>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !label.trim()}
          >
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
