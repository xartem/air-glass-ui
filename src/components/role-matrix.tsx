import { useMemo, useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import type { Permission, RoleDetail } from "@/api";
import { Checkbox } from "@/components/ui/checkbox";
import { t } from "@/lib/i18n";
import { roleDisplayName } from "@/lib/role-label";
import { cn } from "@/lib/utils";

/*
 * RoleMatrix (UI:users-roles §2 · E4 matrix archetype): roles × permission keys.
 * Rows are permission keys grouped into collapsible module sections with a
 * "whole group" checkbox (indeterminate on a partial set); columns are roles
 * with a sticky header (label + user count + a "⋯" slot). The admin (is_system)
 * column is read-only (all checked). The whole grid scrolls horizontally with a
 * sticky first column so it never transposes on mobile.
 *
 * Controlled: `value` maps role id → permission keys; `onChange` returns the
 * next key set for one role. Dirty/batch-save lives in the screen (SaveBar).
 * Stage 3 hands this pattern to later matrix screens.
 */

export type RolePermissionMap = Record<number, string[]>;

function initialCollapsed(): boolean {
  // Accordions start collapsed on narrow viewports (UI:users-roles §2).
  return typeof window !== "undefined" && window.innerWidth < 768;
}

export function RoleMatrix({
  roles,
  permissions,
  value,
  onChange,
  renderRoleMenu,
}: {
  roles: RoleDetail[];
  permissions: Permission[];
  value: RolePermissionMap;
  onChange: (roleId: number, keys: string[]) => void;
  /** Per-column "⋯" menu (rename/delete), owned by the screen. */
  renderRoleMenu?: (role: RoleDetail) => ReactNode;
}) {
  const groups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const permission of permissions) {
      const bucket = map.get(permission.group) ?? [];
      bucket.push(permission.key);
      map.set(permission.group, bucket);
    }
    return [...map.entries()].map(([group, keys]) => ({ group, keys }));
  }, [permissions]);

  const collapsedDefault = useMemo(initialCollapsed, []);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const isCollapsed = (group: string) => collapsed[group] ?? collapsedDefault;

  function has(role: RoleDetail, key: string): boolean {
    if (role.is_system) return true;
    return (value[role.id] ?? []).includes(key);
  }

  function toggle(role: RoleDetail, key: string, checked: boolean): void {
    if (role.is_system) return;
    const current = new Set(value[role.id] ?? []);
    if (checked) current.add(key);
    else current.delete(key);
    onChange(role.id, [...current]);
  }

  function groupCheckState(
    role: RoleDetail,
    keys: string[],
  ): boolean | "indeterminate" {
    if (role.is_system) return true;
    const owned = keys.filter((key) => has(role, key)).length;
    if (owned === 0) return false;
    if (owned === keys.length) return true;
    return "indeterminate";
  }

  function toggleGroup(
    role: RoleDetail,
    keys: string[],
    checked: boolean,
  ): void {
    if (role.is_system) return;
    const current = new Set(value[role.id] ?? []);
    for (const key of keys) {
      if (checked) current.add(key);
      else current.delete(key);
    }
    onChange(role.id, [...current]);
  }

  const cellWidth = "w-32 min-w-32";

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky top-0 start-0 z-20 bg-[var(--glass-bg-overlay)] px-3 py-2.5 text-start align-bottom backdrop-blur-[var(--glass-blur-small)]">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {t("roles.permission")}
              </span>
            </th>
            {roles.map((role) => (
              <th
                key={role.id}
                className={cn(
                  "sticky top-0 z-10 bg-[var(--glass-bg-overlay)] px-3 py-2.5 align-bottom backdrop-blur-[var(--glass-blur-small)]",
                  cellWidth,
                )}
              >
                {/* Reserve the "⋯" button height on every column so labels align
                    whether or not a column has a menu; the screen decides per-role
                    content (system roles may still get "customize dashboard"). */}
                <div className="flex min-h-8 items-center justify-between gap-1">
                  <div className="min-w-0 truncate font-semibold">
                    {roleDisplayName(role)}
                  </div>
                  {renderRoleMenu ? (
                    <div className="shrink-0">{renderRoleMenu(role)}</div>
                  ) : null}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map(({ group, keys }) => (
            <GroupRows
              key={group}
              group={group}
              keys={keys}
              roles={roles}
              collapsed={isCollapsed(group)}
              onToggleCollapse={() =>
                setCollapsed((current) => ({
                  ...current,
                  [group]: !isCollapsed(group),
                }))
              }
              has={has}
              toggle={toggle}
              groupCheckState={groupCheckState}
              toggleGroup={toggleGroup}
              cellWidth={cellWidth}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  keys,
  roles,
  collapsed,
  onToggleCollapse,
  has,
  toggle,
  groupCheckState,
  toggleGroup,
  cellWidth,
}: {
  group: string;
  keys: string[];
  roles: RoleDetail[];
  collapsed: boolean;
  onToggleCollapse: () => void;
  has: (role: RoleDetail, key: string) => boolean;
  toggle: (role: RoleDetail, key: string, checked: boolean) => void;
  groupCheckState: (
    role: RoleDetail,
    keys: string[],
  ) => boolean | "indeterminate";
  toggleGroup: (role: RoleDetail, keys: string[], checked: boolean) => void;
  cellWidth: string;
}) {
  // Fall back to the raw module slug when no translation is registered.
  const groupLabel = (() => {
    const translated = t(`permissions.group.${group}`);
    return translated === `permissions.group.${group}` ? group : translated;
  })();

  return (
    <>
      <tr className="border-t bg-muted/30">
        <th className="sticky start-0 z-10 bg-[var(--glass-bg-overlay)] px-3 py-2 text-start backdrop-blur-[var(--glass-blur-small)]">
          <button
            type="button"
            className="flex items-center gap-1.5 font-medium hover:text-foreground"
            onClick={onToggleCollapse}
          >
            <ChevronRight
              className={cn(
                "size-4 shrink-0 transition-transform rtl:-scale-x-100",
                !collapsed && "rotate-90",
              )}
            />
            <span className="truncate">{groupLabel}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {keys.length}
            </span>
          </button>
        </th>
        {roles.map((role) => (
          <td
            key={role.id}
            className={cn("px-3 py-2 text-center align-middle", cellWidth)}
          >
            <Checkbox
              checked={groupCheckState(role, keys)}
              disabled={role.is_system}
              aria-label={`${groupLabel} · ${roleDisplayName(role)}`}
              onCheckedChange={(checked) =>
                toggleGroup(role, keys, checked === true)
              }
            />
          </td>
        ))}
      </tr>
      {!collapsed
        ? keys.map((key) => (
            <tr key={key} className="border-t hover:bg-muted/20">
              <td className="sticky start-0 z-10 bg-[var(--glass-bg-overlay)] px-3 py-1.5 ps-9 backdrop-blur-[var(--glass-blur-small)]">
                <span className="font-mono text-xs text-muted-foreground">
                  {key}
                </span>
              </td>
              {roles.map((role) => (
                <td
                  key={role.id}
                  className={cn(
                    "px-3 py-1.5 text-center align-middle",
                    cellWidth,
                  )}
                >
                  <Checkbox
                    checked={has(role, key)}
                    disabled={role.is_system}
                    aria-label={`${key} · ${roleDisplayName(role)}`}
                    onCheckedChange={(checked) =>
                      toggle(role, key, checked === true)
                    }
                  />
                </td>
              ))}
            </tr>
          ))
        : null}
    </>
  );
}
