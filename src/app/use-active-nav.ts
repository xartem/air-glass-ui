import { useLocation } from "react-router";

import {
  buildNavGroups,
  isNavParent,
  type NavEntry,
  type NavGroup,
  type NavItem,
} from "@/app/nav";
import { usePermissionChecker } from "@/lib/permissions";

/*
 * Shared navigation helpers: permission filtering and active-route resolution.
 * Used by every shell chrome variant (sidebar, rail, horizontal bar).
 */

function matchesPath(item: { to: string }, pathname: string): boolean {
  return item.to === "/"
    ? pathname === "/"
    : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Depth-first leaf collection — parents are toggles, only leaves carry routes. */
export function collectLeaves(entry: NavEntry): NavItem[] {
  return isNavParent(entry) ? entry.children.flatMap(collectLeaves) : [entry];
}

/** Only the DEEPEST matching leaf is active — /c/products must not light up on /c/products/categories. */
export function resolveActiveTo(
  groups: { items: NavEntry[] }[],
  pathname: string,
): string | null {
  let best: string | null = null;
  for (const group of groups) {
    for (const entry of group.items) {
      for (const item of collectLeaves(entry)) {
        if (
          matchesPath(item, pathname) &&
          (best === null || item.to.length > best.length)
        )
          best = item.to;
      }
    }
  }
  return best;
}

/** RBAC filter, recursive: leaves drop by permission; a parent disappears once it has no children. */
export function filterEntry(
  entry: NavEntry,
  can: (perm?: string) => boolean,
): NavEntry | null {
  if (!isNavParent(entry)) return can(entry.perm) ? entry : null;
  const children = entry.children
    .map((child) => filterEntry(child, can))
    .filter((child): child is NavEntry => child !== null);
  return children.length > 0 ? { ...entry, children } : null;
}

/** The permission-filtered nav groups — shared by every layout variant (sidebar, rail, top bar). */
export function filterGroups(can: (perm?: string) => boolean): NavGroup[] {
  return buildNavGroups()
    .map((group) => ({
      ...group,
      items: group.items
        .map((entry) => filterEntry(entry, can))
        .filter((entry): entry is NavEntry => entry !== null),
    }))
    .filter((group) => group.items.length > 0);
}

/** Filtered nav + active-route resolution, shared by the horizontal bar and the two-column rail. */
export function useActiveNav() {
  const can = usePermissionChecker();
  const { pathname } = useLocation();
  const groups = filterGroups(can);
  const activeTo = resolveActiveTo(groups, pathname);
  const activeGroupKey = groups.find((group) =>
    group.items.some((entry) =>
      collectLeaves(entry).some((leaf) => leaf.to === activeTo),
    ),
  )?.key;
  return { groups, activeTo, activeGroupKey };
}
