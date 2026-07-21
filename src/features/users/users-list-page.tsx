import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { KeyRound, LogIn, Pencil, UserCheck, Users, UserX } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import {
  api,
  ValidationError,
  type RoleDetail,
  type UserListItem,
} from "@/api";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { SearchInput } from "@/components/toolbar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t, type AdminLocale } from "@/lib/i18n";
import { roleDisplayName } from "@/lib/role-label";
import { useLocale } from "@/lib/use-locale";

/*
 * /users (UI:users-roles §2): admin accounts. Filters (role, active, search)
 * live in the URL. Row "⋯" carries edit / change-password / impersonate /
 * (de)activate — impersonation and the invariant guards (self, last admin) are
 * server-enforced (D:users §4, C3 §10); ineligible actions are hidden per row.
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
  ar,
};

export function UsersListPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [passwordTarget, setPasswordTarget] = useState<UserListItem | null>(
    null,
  );
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [activeTarget, setActiveTarget] = useState<{
    user: UserListItem;
    next: boolean;
  } | null>(null);
  const [impersonateTarget, setImpersonateTarget] =
    useState<UserListItem | null>(null);

  // Local text input mirrors the URL `q`; debounced to avoid a request per keystroke.
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  useEffect(() => {
    // [FIX] Without this guard the effect also fired on mount, and
    // patchParams drops `page` — killing deep-links like /users?page=3.
    if (searchInput === (searchParams.get("q") ?? "")) return;
    const handle = window.setTimeout(() => {
      patchParams({ q: searchInput || undefined });
    }, 300);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounce reacts to typed text only
  }, [searchInput]);

  const filters = {
    page: Number(searchParams.get("page") ?? 1),
    q: searchParams.get("q") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    active:
      (searchParams.get("active") as "active" | "inactive" | null) ?? undefined,
    sort:
      (searchParams.get("sort") as "name" | "role" | "last_login" | null) ??
      "last_login",
    dir: (searchParams.get("dir") as "asc" | "desc" | null) ?? "desc",
  };

  function patchParams(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next, { replace: true });
  }

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: api.roles.all,
    staleTime: 30_000,
  });
  const listQuery = useQuery({
    queryKey: ["users", filters],
    queryFn: () => api.users.list(filters),
    placeholderData: (previous) => previous,
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      api.users.update(id, { password }),
    onSuccess: () => {
      toast.success(t("users.password.saved"));
      setPasswordTarget(null);
    },
    onError: (cause) => {
      if (cause instanceof ValidationError && cause.fields.password) {
        setPasswordError(t(`users.error.${cause.fields.password}`));
      } else {
        toast.error(t("common.request_failed"));
      }
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: boolean }) =>
      next ? api.users.activate(id) : api.users.deactivate(id),
    onSuccess: (_data, variables) => {
      toast.success(
        t(variables.next ? "users.activated" : "users.deactivated"),
      );
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (cause) => {
      // Server invariants (self / last active admin) surface as 422 codes.
      const code =
        cause instanceof ValidationError ? cause.fields._error : undefined;
      toast.error(code ? t(`users.error.${code}`) : t("common.request_failed"));
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: number) => api.auth.impersonate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        id: "name",
        header: t("users.col.name"),
        meta: { sortable: true },
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <span className="truncate">{user.name}</span>
                {user.is_self ? (
                  <span className="text-xs text-muted-foreground">
                    {t("users.you")}
                  </span>
                ) : null}
                <span className="md:hidden">
                  {!user.is_active ? (
                    <StatusBadge
                      status="archived"
                      label={t("users.inactive")}
                    />
                  ) : null}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {user.email}
              </div>
            </div>
          );
        },
      },
      {
        id: "role",
        header: t("users.col.role"),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {roleDisplayName(row.original.role)}
          </span>
        ),
      },
      {
        id: "active",
        header: t("users.col.active"),
        cell: ({ row }) =>
          row.original.is_active ? (
            <StatusBadge status="success" label={t("users.active")} />
          ) : (
            <StatusBadge status="archived" label={t("users.inactive")} />
          ),
        meta: { className: "max-md:hidden" },
      },
      {
        id: "last_login",
        header: t("users.col.last_login"),
        cell: ({ row }) => {
          const iso = row.original.last_login_at;
          return (
            <span className="whitespace-nowrap text-muted-foreground">
              {iso
                ? formatDistanceToNow(new Date(iso), {
                    addSuffix: true,
                    locale: DATE_LOCALES[locale],
                  })
                : t("users.never")}
            </span>
          );
        },
        meta: { className: "max-md:hidden", sortable: true },
      },
    ],
    [locale],
  );

  const rowActions: RowAction<UserListItem>[] = [
    {
      key: "edit",
      label: t("common.edit"),
      icon: <Pencil />,
      permission: "users.manage",
      onSelect: (user) => navigate(`/users/${user.id}`),
    },
    {
      key: "password",
      label: t("users.password.action"),
      icon: <KeyRound />,
      permission: "users.manage",
      onSelect: (user) => {
        setPasswordError(undefined);
        setPasswordTarget(user);
      },
    },
    {
      key: "impersonate",
      label: t("users.impersonate.action"),
      icon: <LogIn />,
      permission: "users.impersonate",
      hidden: (user) => !user.impersonatable,
      onSelect: (user) => setImpersonateTarget(user),
    },
    {
      key: "deactivate",
      label: t("users.deactivate.action"),
      icon: <UserX />,
      destructive: true,
      permission: "users.manage",
      hidden: (user) => !user.is_active,
      // Self / last active admin: disabled with a hint, not hidden (UI:users-roles §2).
      disabled: (user) => user.is_self || user.is_last_admin,
      disabledHint: (user) =>
        user.is_self
          ? t("users.deactivate.self_hint")
          : t("users.deactivate.last_admin_hint"),
      onSelect: (user) => setActiveTarget({ user, next: false }),
    },
    {
      key: "activate",
      label: t("users.activate.action"),
      icon: <UserCheck />,
      permission: "users.manage",
      hidden: (user) => user.is_active,
      onSelect: (user) => activeMutation.mutate({ id: user.id, next: true }),
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
        title={t("nav.users")}
        icon={Users}
        helpKey="users.list"
        primaryAction={{
          label: t("users.add"),
          href: "/users/new",
          permission: "users.manage",
        }}
      />

      {/* Search + filters live in the panel header (E6 §1A), like /system/activity */}
      <Panel
        icon={Users}
        title={t("nav.users")}
        description={t("users.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              placeholder={t("users.search_placeholder")}
              className="w-56"
            />
            <Select
              value={filters.role ?? "all"}
              onValueChange={(value) =>
                patchParams({ role: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("users.filter.role")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("users.filter.all_roles")}
                </SelectItem>
                {(rolesQuery.data ?? []).map((role: RoleDetail) => (
                  <SelectItem key={role.id} value={role.key}>
                    {roleDisplayName(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.active ?? "all"}
              onValueChange={(value) =>
                patchParams({ active: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t("users.filter.active")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("users.filter.all_active")}
                </SelectItem>
                <SelectItem value="active">{t("users.active")}</SelectItem>
                <SelectItem value="inactive">{t("users.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<UserListItem>
          label={t("nav.users")}
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
          sort={{ column: filters.sort, dir: filters.dir }}
          onSort={(column, dir) => patchParams({ sort: column, dir })}
          onPage={(page) => patchParams({ page: String(page) })}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("users.empty"),
            description: t("users.empty_hint"),
          }}
        />
      </Panel>

      <ChangePasswordDialog
        open={passwordTarget !== null}
        onOpenChange={(open) => !open && setPasswordTarget(null)}
        userName={passwordTarget?.name ?? ""}
        saving={passwordMutation.isPending}
        error={passwordError}
        onConfirm={(password) => {
          if (passwordTarget)
            passwordMutation.mutate({ id: passwordTarget.id, password });
        }}
      />

      <ConfirmDialog
        open={activeTarget?.next === false}
        onOpenChange={(open) => !open && setActiveTarget(null)}
        title={t("users.deactivate.title", {
          name: activeTarget?.user.name ?? "",
        })}
        description={t("users.deactivate.description")}
        confirmLabel={t("users.deactivate.action")}
        destructive
        onConfirm={() => {
          if (activeTarget)
            activeMutation.mutate({ id: activeTarget.user.id, next: false });
          setActiveTarget(null);
        }}
      />

      <ConfirmDialog
        open={impersonateTarget !== null}
        onOpenChange={(open) => !open && setImpersonateTarget(null)}
        title={t("users.impersonate.title", {
          name: impersonateTarget?.name ?? "",
        })}
        description={t("users.impersonate.description")}
        confirmLabel={t("users.impersonate.action")}
        onConfirm={() => {
          if (impersonateTarget)
            impersonateMutation.mutate(impersonateTarget.id);
          setImpersonateTarget(null);
        }}
      />
    </div>
  );
}
