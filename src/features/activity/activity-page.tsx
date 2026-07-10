import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { Activity, ArrowRight, Bot, Eye, History, UserCog } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type ActivityEntry } from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable, type RowAction } from "@/components/data-table";
import { DateRangePicker } from "@/components/date-range-picker";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import {
  ReferencePicker,
  type ReferenceItem,
} from "@/components/reference-picker";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { actionLabel, entityLabel, entityTitle } from "@/lib/activity-labels";
import { useSiteDateTime } from "@/lib/datetime";
import { t, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /system/activity (UI:shell-auth §2): the audit trail with restore (C8 §2).
 * Filters (actor, entity type, AI) live in the URL (deep-links, E2 §6). Entity
 * types and actions are translated (t('activity.entity.*'/'activity.action.*'),
 * raw key falls back to the stable server token). Row details open a Sheet with
 * full metadata + the field/old/new diff; Restore is confirmed and only offered
 * on entries that carry `changes`.
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

const ENTITY_TYPES = [
  "page",
  "record",
  "form",
  "menu",
  "media",
  "user",
  "settings",
];
const ACTIONS = [
  "created",
  "updated",
  "published",
  "deleted",
  "restored",
  "reordered",
];

export function ActivityPage() {
  const locale = useLocale();
  const siteTime = useSiteDateTime();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [details, setDetails] = useState<ActivityEntry | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<ActivityEntry | null>(
    null,
  );
  const [actor, setActor] = useState<ReferenceItem | null>(null);

  const actorId = searchParams.get("actor_id") ?? undefined;

  const filters = {
    page: Number(searchParams.get("page") ?? 1),
    actor_id: actorId ? Number(actorId) : undefined,
    entity_type: searchParams.get("type") ?? undefined,
    action: searchParams.get("action") ?? undefined,
    only_ai: searchParams.get("ai") === "1",
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    sort: "date" as const,
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

  // Searchable user filter (up to 10 shown). actor_id is the source of truth in
  // the URL; the label is resolved lazily for deep-linked ids we don't hold yet.
  const searchActors = useCallback(
    async (query: string): Promise<ReferenceItem[]> => {
      const result = await api.users.list({ q: query || undefined, page: 1 });
      return result.rows
        .slice(0, 10)
        .map((user) => ({ id: user.id, label: user.name, hint: user.email }));
    },
    [],
  );

  const actorLookup = useQuery({
    queryKey: ["user", actorId],
    queryFn: () => api.users.get(Number(actorId)),
    enabled: Boolean(actorId) && (!actor || String(actor.id) !== actorId),
  });

  const actorValue = useMemo<ReferenceItem | null>(() => {
    if (!actorId) return null;
    if (actor && String(actor.id) === actorId) return actor;
    return {
      id: Number(actorId),
      label: actorLookup.data?.name ?? `#${actorId}`,
    };
  }, [actorId, actor, actorLookup.data]);

  function selectActor(item: ReferenceItem | null) {
    setActor(item);
    patchParams({ actor_id: item ? String(item.id) : undefined });
  }

  const listQuery = useQuery({
    queryKey: ["activity", filters],
    queryFn: () => api.activity.list(filters),
    placeholderData: (previous) => previous,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: number) => api.activity.restore(id),
    onSuccess: () => {
      toast.success(t("activity.restored"));
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const columns = useMemo<ColumnDef<ActivityEntry>[]>(
    () => [
      {
        id: "date",
        header: t("activity.col.date"),
        meta: { sortable: true },
        cell: ({ row }) => {
          const iso = row.original.created_at;
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="whitespace-nowrap text-muted-foreground">
                  {formatDistanceToNow(new Date(iso), {
                    addSuffix: true,
                    locale: DATE_LOCALES[locale],
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent>{siteTime.formatLong(iso)}</TooltipContent>
            </Tooltip>
          );
        },
      },
      {
        id: "actor",
        header: t("activity.col.actor"),
        cell: ({ row }) => {
          const entry = row.original;
          if (entry.is_ai) {
            return (
              <Badge variant="secondary" className="gap-1">
                <Bot className="size-3" />
                AI
              </Badge>
            );
          }
          return (
            <span className="whitespace-nowrap">
              {entry.actor?.name ?? "—"}
              {entry.impersonator ? (
                <span className="block text-xs text-muted-foreground">
                  {t("activity.via", { name: entry.impersonator.name })}
                </span>
              ) : null}
            </span>
          );
        },
      },
      {
        id: "description",
        header: t("activity.col.action"),
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <span className="flex min-w-48 items-baseline gap-1.5">
              <span className="font-medium whitespace-nowrap">
                {actionLabel(entry.action)}
              </span>
              <span className="truncate text-muted-foreground">
                {entityTitle(entry)}
              </span>
            </span>
          );
        },
      },
      {
        id: "entity",
        header: t("activity.col.entity"),
        cell: ({ row }) => {
          const entry = row.original;
          const label = `${entityLabel(entry.entity_type)} #${entry.entity_id}`;
          return entry.url ? (
            <Link
              to={entry.url}
              className="whitespace-nowrap text-primary underline-offset-2 hover:underline"
            >
              {label}
            </Link>
          ) : (
            <span className="whitespace-nowrap text-muted-foreground">
              {label}
            </span>
          );
        },
        meta: { className: "max-md:hidden" },
      },
    ],
    [locale, siteTime],
  );

  const rowActions: RowAction<ActivityEntry>[] = [
    {
      key: "details",
      label: t("activity.details"),
      icon: <Eye />,
      onSelect: (entry) => setDetails(entry),
    },
    {
      key: "restore",
      label: t("activity.restore"),
      icon: <History />,
      permission: "activity.restore",
      // Only entries carrying a field diff are restorable (UI:shell-auth §2).
      hidden: (entry) => !entry.changes,
      onSelect: (entry) => setRestoreTarget(entry),
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
      <PageHeader title={t("nav.activity")} />
      {/* Filters live in the panel header; no text search on this screen (UI:shell-auth) */}
      <Panel
        icon={Activity}
        title={t("nav.activity")}
        description={t("activity.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={filters.only_ai}
                onCheckedChange={(checked) =>
                  patchParams({ ai: checked ? "1" : undefined })
                }
              />
              {t("activity.filter.only_ai")}
            </label>
            <ReferencePicker
              value={actorValue}
              onChange={selectActor}
              search={searchActors}
              placeholder={t("activity.filter.actor")}
              className="w-56"
            />
            <Select
              value={filters.entity_type ?? "all"}
              onValueChange={(value) =>
                patchParams({ type: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("activity.filter.type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("activity.filter.all_types")}
                </SelectItem>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {entityLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.action ?? "all"}
              onValueChange={(value) =>
                patchParams({ action: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={t("activity.filter.action")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("activity.filter.all_actions")}
                </SelectItem>
                {ACTIONS.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabel(action)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={{ from: filters.from, to: filters.to }}
              onChange={(next) => patchParams({ from: next.from, to: next.to })}
              placeholder={t("activity.filter.period")}
              className="w-56"
            />
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<ActivityEntry>
          label={t("nav.activity")}
          columns={columns}
          data={data?.rows ?? []}
          state={state}
          rowActions={rowActions}
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
          sort={{ column: "date", dir: filters.dir }}
          onSort={(_column, dir) => patchParams({ dir })}
          onPage={(page) => patchParams({ page: String(page) })}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t("activity.empty"),
            description: t("activity.empty_hint"),
          }}
        />
      </Panel>

      {/* Details: full metadata + the field · old · new diff from `changes` */}
      <Sheet
        open={details !== null}
        onOpenChange={(open) => !open && setDetails(null)}
      >
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{details ? entityTitle(details) : ""}</SheetTitle>
            <SheetDescription>
              {details ? siteTime.formatLong(details.created_at) : ""}
            </SheetDescription>
          </SheetHeader>
          {details ? (
            <div className="space-y-5 px-4 pb-4">
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">
                  {t("activity.detail.actor")}
                </dt>
                <dd className="flex flex-wrap items-center gap-1.5">
                  {details.is_ai ? (
                    <Badge variant="secondary" className="gap-1">
                      <Bot className="size-3" />
                      AI
                    </Badge>
                  ) : (
                    <span>{details.actor?.name ?? "—"}</span>
                  )}
                  {details.impersonator ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <UserCog className="size-3" />
                      {t("activity.detail.impersonated_by", {
                        name: details.impersonator.name,
                      })}
                    </span>
                  ) : null}
                </dd>

                <dt className="text-muted-foreground">
                  {t("activity.detail.action")}
                </dt>
                <dd>
                  <Badge variant="outline">{actionLabel(details.action)}</Badge>
                </dd>

                <dt className="text-muted-foreground">
                  {t("activity.detail.entity")}
                </dt>
                <dd>
                  {details.url ? (
                    <Link
                      to={details.url}
                      className="text-primary underline-offset-2 hover:underline"
                      onClick={() => setDetails(null)}
                    >
                      {entityLabel(details.entity_type)} #{details.entity_id}
                    </Link>
                  ) : (
                    <span>
                      {entityLabel(details.entity_type)} #{details.entity_id}
                    </span>
                  )}
                </dd>

                <dt className="text-muted-foreground">
                  {t("activity.detail.date")}
                </dt>
                <dd>{siteTime.formatLong(details.created_at)}</dd>
              </dl>

              {details.changes ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("activity.detail.changes")}
                  </p>
                  {/* Field · was → became, stacked so long values stay readable in the sheet */}
                  <ul className="space-y-2">
                    {Object.entries(details.changes).map(([field, change]) => (
                      <li
                        key={field}
                        className="rounded-lg p-2.5 ring-1 ring-border"
                      >
                        <p className="font-mono text-xs break-all text-muted-foreground">
                          {field}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded bg-destructive/10 px-1.5 py-0.5 break-all text-destructive">
                            {change.old ?? "—"}
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="rounded bg-[var(--status-success-bg)] px-1.5 py-0.5 break-all text-[var(--status-success-fg)]">
                            {change.new ?? "—"}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("activity.no_changes")}
                </p>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={restoreTarget !== null}
        onOpenChange={(open) => !open && setRestoreTarget(null)}
        title={t("activity.restore_title")}
        description={t("activity.restore_description", {
          fields: restoreTarget?.changes
            ? Object.keys(restoreTarget.changes).join(", ")
            : "",
        })}
        confirmLabel={t("activity.restore")}
        onConfirm={() => {
          if (restoreTarget) restoreMutation.mutate(restoreTarget.id);
          setRestoreTarget(null);
        }}
      />
    </div>
  );
}
