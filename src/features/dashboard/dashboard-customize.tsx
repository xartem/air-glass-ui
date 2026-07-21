import { useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  Eye,
  EyeOff,
  GripVertical,
  List,
  TrendingUp,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  api,
  type RoleDetail,
  type WidgetSize,
  type WidgetType,
  type LayoutOverrides,
} from "@/api";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetGrid, WIDGET_SPAN } from "@/components/widget-grid";
import { dashboardIcon } from "@/lib/dashboard-icons";
import { createDndA11y } from "@/lib/dnd-a11y";
import { t } from "@/lib/i18n";
import { roleDisplayName } from "@/lib/role-label";
import { cn } from "@/lib/utils";

/*
 * Customize mode (UI:dashboard §2): per-ROLE layout editing (dashboard.manage).
 * Cards render meta only — no widget data is loaded here by design. Widgets get
 * dnd order + size menu + hide; quick actions get dnd order + hide (no size tier).
 * Hidden widgets AND actions live in one restore panel below.
 * RBAC is not editable from here: a widget/action the role has no permission for
 * is absent from the payload entirely (D:dashboard §9).
 */

const SIZES: WidgetSize[] = ["sm", "md", "lg", "xl"];

const TYPE_ICONS: Record<WidgetType, typeof List> = {
  stat: TrendingUp,
  chart: BarChart3,
  list: List,
  status: Activity,
};

interface Tile {
  key: string;
  title_key: string;
  type: WidgetType;
  size: WidgetSize;
  icon?: string;
  hidden: boolean;
}

interface ActionRow {
  key: string;
  label_key: string;
  icon: string;
  hidden: boolean;
}

export function DashboardCustomize({
  roleKey,
  roles,
  onSwitchRole,
  onExit,
}: {
  roleKey: string;
  roles: RoleDetail[];
  onSwitchRole: (key: string) => void;
  onExit: () => void;
}) {
  const queryClient = useQueryClient();
  const roleMatch = roles.find((role) => role.key === roleKey);
  const roleLabel = roleMatch ? roleDisplayName(roleMatch) : roleKey;

  // Edit surface: no focus-refetch so local reordering never gets clobbered mid-edit.
  const query = useQuery({
    queryKey: ["dashboard", "customize", roleKey],
    queryFn: () => api.dashboard.get(roleKey),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [actions, setActions] = useState<ActionRow[]>([]);
  const [baseline, setBaseline] = useState("");
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    const nextTiles = query.data.widgets.map((meta) => ({
      key: meta.key,
      title_key: meta.title_key,
      type: meta.type,
      size: meta.size,
      icon: meta.icon,
      hidden: meta.hidden ?? false,
    }));
    const nextActions = query.data.actions.map((action) => ({
      key: action.key,
      label_key: action.label_key,
      icon: action.icon,
      hidden: action.hidden ?? false,
    }));
    setTiles(nextTiles);
    setActions(nextActions);
    setBaseline(JSON.stringify({ tiles: nextTiles, actions: nextActions }));
  }, [query.data]);

  const dirty = useMemo(
    () => JSON.stringify({ tiles, actions }) !== baseline,
    [tiles, actions, baseline],
  );
  const visible = tiles.filter((tile) => !tile.hidden);
  const hidden = tiles.filter((tile) => tile.hidden);
  const visibleActions = actions.filter((action) => !action.hidden);
  const hiddenActions = actions.filter((action) => action.hidden);

  const sensors = useSensors(
    // Drag only via the explicit handle; touch needs a long-press (E2 §5a).
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    // Keyboard alternative to dragging (WCAG 2.1.1 / 2.5.7): focus a grip handle,
    // press Space to pick up, arrow keys to move, Space to drop.
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const saveMutation = useMutation({
    mutationFn: () => {
      const overrides: LayoutOverrides = { widgets: {}, actions: {} };
      visible.forEach((tile, index) => {
        overrides.widgets[tile.key] = {
          size: tile.size,
          sort: (index + 1) * 10,
          hidden: false,
        };
      });
      hidden.forEach((tile, index) => {
        overrides.widgets[tile.key] = {
          size: tile.size,
          sort: (visible.length + index + 1) * 10,
          hidden: true,
        };
      });
      visibleActions.forEach((action, index) => {
        overrides.actions![action.key] = {
          sort: (index + 1) * 10,
          hidden: false,
        };
      });
      hiddenActions.forEach((action, index) => {
        overrides.actions![action.key] = {
          sort: (visibleActions.length + index + 1) * 10,
          hidden: true,
        };
      });
      return api.dashboard.saveLayout(roleKey, overrides);
    },
    onSuccess: async () => {
      toast.success(t("dashboard.customize.saved"));
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onExit();
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const resetMutation = useMutation({
    mutationFn: () => api.dashboard.resetLayout(roleKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTiles((current) => {
      const visibleKeys = current
        .filter((tile) => !tile.hidden)
        .map((tile) => tile.key);
      const from = visibleKeys.indexOf(String(active.id));
      const to = visibleKeys.indexOf(String(over.id));
      if (from < 0 || to < 0) return current;
      const nextVisible = arrayMove(
        current.filter((tile) => !tile.hidden),
        from,
        to,
      );
      return [...nextVisible, ...current.filter((tile) => tile.hidden)];
    });
  }

  function onActionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setActions((current) => {
      const visibleKeys = current
        .filter((action) => !action.hidden)
        .map((action) => action.key);
      const from = visibleKeys.indexOf(String(active.id));
      const to = visibleKeys.indexOf(String(over.id));
      if (from < 0 || to < 0) return current;
      const nextVisible = arrayMove(
        current.filter((action) => !action.hidden),
        from,
        to,
      );
      return [...nextVisible, ...current.filter((action) => action.hidden)];
    });
  }

  function patchTile(key: string, patch: Partial<Tile>) {
    setTiles((current) =>
      current.map((tile) => (tile.key === key ? { ...tile, ...patch } : tile)),
    );
  }

  function restoreTile(key: string) {
    // Restored widgets go to the end of the visible order.
    setTiles((current) => {
      const target = current.find((tile) => tile.key === key);
      if (!target) return current;
      const rest = current.filter((tile) => tile.key !== key);
      const visibleRest = rest.filter((tile) => !tile.hidden);
      const hiddenRest = rest.filter((tile) => tile.hidden);
      return [...visibleRest, { ...target, hidden: false }, ...hiddenRest];
    });
  }

  function hideAction(key: string) {
    setActions((current) =>
      current.map((action) =>
        action.key === key ? { ...action, hidden: true } : action,
      ),
    );
  }

  function restoreAction(key: string) {
    setActions((current) => {
      const target = current.find((action) => action.key === key);
      if (!target) return current;
      const rest = current.filter((action) => action.key !== key);
      const visibleRest = rest.filter((action) => !action.hidden);
      const hiddenRest = rest.filter((action) => action.hidden);
      return [...visibleRest, { ...target, hidden: false }, ...hiddenRest];
    });
  }

  const nothingHidden = hidden.length === 0 && hiddenActions.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.customize")}
        subtitle={t("dashboard.customize.editing_role", { role: roleLabel })}
        actions={
          <>
            <Button
              variant="ghost"
              onClick={onExit}
              disabled={saveMutation.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !dirty}
            >
              {t("common.save")}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={roleKey}
          onValueChange={(key) => {
            if (key === roleKey) return;
            // Role switch with unsaved edits → dirty-guard (UI:dashboard §2).
            if (dirty) setPendingRole(key);
            else onSwitchRole(key);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.key} value={role.key}>
                {roleDisplayName(role)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? (
        <WidgetGrid>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-20 rounded-xl md:col-span-3 xl:col-span-3"
            />
          ))}
        </WidgetGrid>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            accessibility={createDndA11y(t("dnd.item.widget"))}
          >
            <SortableContext
              items={visible.map((tile) => tile.key)}
              strategy={rectSortingStrategy}
            >
              <WidgetGrid>
                {visible.map((tile) => (
                  <SortableTile
                    key={tile.key}
                    tile={tile}
                    onSize={(size) => patchTile(tile.key, { size })}
                    onHide={() => patchTile(tile.key, { hidden: true })}
                  />
                ))}
              </WidgetGrid>
            </SortableContext>
          </DndContext>

          {/* Quick actions section (UI:dashboard §2): dnd order + hide, no size tier. */}
          {actions.length > 0 ? (
            <Panel icon={Zap} title={t("dashboard.customize.actions_title")}>
              {visibleActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.customize.actions_all_hidden")}
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onActionDragEnd}
                  accessibility={createDndA11y(t("dnd.item.action"))}
                >
                  <SortableContext
                    items={visibleActions.map((action) => action.key)}
                    strategy={rectSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {visibleActions.map((action) => (
                        <SortableActionRow
                          key={action.key}
                          action={action}
                          onHide={() => hideAction(action.key)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Panel>
          ) : null}

          <Panel icon={EyeOff} title={t("dashboard.customize.hidden_title")}>
            {nothingHidden ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.customize.hidden_empty")}
              </p>
            ) : (
              <ul className="space-y-2">
                {hidden.map((tile) => {
                  const Icon =
                    dashboardIcon(tile.icon) ?? TYPE_ICONS[tile.type];
                  return (
                    <li
                      key={tile.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {t(tile.title_key)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreTile(tile.key)}
                      >
                        <Eye />
                        {t("dashboard.customize.restore")}
                      </Button>
                    </li>
                  );
                })}
                {hiddenActions.map((action) => {
                  const Icon = dashboardIcon(action.icon) ?? Zap;
                  return (
                    <li
                      key={action.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {t(action.label_key)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreAction(action.key)}
                      >
                        <Eye />
                        {t("dashboard.customize.restore")}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* Reset lives away from Save (E6 §2: destructive never near the primary action). */}
          <div>
            <Button
              variant="outline"
              onClick={() => setResetOpen(true)}
              disabled={resetMutation.isPending}
            >
              {t("dashboard.customize.reset_action")}
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t("dashboard.customize.reset_title", { role: roleLabel })}
        description={t("dashboard.customize.reset_description")}
        confirmLabel={t("dashboard.customize.reset_action")}
        destructive
        onConfirm={() => {
          setResetOpen(false);
          resetMutation.mutate();
        }}
      />

      <ConfirmDialog
        open={pendingRole !== null}
        onOpenChange={(open) => !open && setPendingRole(null)}
        title={t("dashboard.customize.dirty_title")}
        description={t("dashboard.customize.dirty_description")}
        confirmLabel={t("dashboard.customize.dirty_leave")}
        onConfirm={() => {
          if (pendingRole) onSwitchRole(pendingRole);
          setPendingRole(null);
        }}
      />
    </div>
  );
}

function SortableTile({
  tile,
  onSize,
  onHide,
}: {
  tile: Tile;
  onSize: (size: WidgetSize) => void;
  onHide: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.key });
  const Icon = dashboardIcon(tile.icon) ?? TYPE_ICONS[tile.type];
  return (
    <Card
      ref={setNodeRef}
      data-slot="widget-placeholder"
      size="sm"
      // CSS.Translate (not CSS.Transform) — tiles have different column spans
      // (WIDGET_SPAN), so Transform's scaleX/scaleY would stretch the dragged
      // tile to the target's size mid-drag. Translate keeps the tile its own size.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        WIDGET_SPAN[tile.size],
        isDragging && "z-10 opacity-80 shadow-lg",
      )}
    >
      <CardContent className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={t("common.actions")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {t(tile.title_key)}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t(`dashboard.customize.size_${tile.size}`)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SIZES.map((size) => (
              <DropdownMenuItem key={size} onSelect={() => onSize(size)}>
                {t(`dashboard.customize.size_${size}`)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("dashboard.customize.hide")}
          onClick={onHide}
        >
          <EyeOff />
        </Button>
      </CardContent>
    </Card>
  );
}

function SortableActionRow({
  action,
  onHide,
}: {
  action: ActionRow;
  onHide: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.key });
  const Icon = dashboardIcon(action.icon) ?? Zap;
  return (
    <Card
      ref={setNodeRef}
      data-slot="widget-placeholder"
      size="sm"
      // Translate-only (see SortableTile): reorder should move, never scale.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "z-10 opacity-80 shadow-lg")}
    >
      <CardContent className="flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={t("common.actions")}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {t(action.label_key)}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t("dashboard.customize.hide")}
          onClick={onHide}
        >
          <EyeOff />
        </Button>
      </CardContent>
    </Card>
  );
}
