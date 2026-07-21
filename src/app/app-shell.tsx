import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  Droplet,
  ExternalLink,
  Globe,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  User,
  UserCircle,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router";

import { api, type AppearanceStyle } from "@/api";
import {
  buildNavGroups,
  isNavParent,
  type NavEntry,
  type NavGroup,
  type NavIcon,
  type NavItem,
  type NavParent,
} from "@/app/nav";
import { HorizontalNav } from "@/app/horizontal-nav";
import {
  collectLeaves,
  filterGroups,
  resolveActiveTo,
  useActiveNav,
} from "@/app/use-active-nav";
import { Button } from "@/components/ui/button";
import { DirectionProvider } from "@/components/ui/direction";
import { AiPanel } from "@/components/ai-panel";
import { ThemeCustomizer } from "@/components/theme-customizer";
import {
  CommandPalette,
  CommandPaletteTrigger,
} from "@/components/command-palette";
import { GlobalProgress } from "@/components/global-progress";
import {
  NotificationsMenu,
  type AdminNotification,
} from "@/components/notifications-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppearance } from "@/lib/appearance";
import { useAuth } from "@/lib/auth";
import {
  ADMIN_LOCALES,
  LOCALE_NAMES,
  setLocale,
  t,
  type AdminLocale,
} from "@/lib/i18n";
import { useCan, usePermissionChecker } from "@/lib/permissions";
import { roleDisplayName } from "@/lib/role-label";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * SPA layout shell (E2 §3 app/, E5): glass sidebar + glass topbar over the mesh
 * background. The mesh is painted HERE exactly once (E1 §2.1) — screens never touch it.
 * Sidebar renders the full E5 menu map filtered by permissions; collection entries
 * are dynamic from GET /api/me (new record types appear without a rebuild, E2 §4).
 * Desktop: collapsible groups + collapse-to-icons; below `lg` — a burger Sheet.
 */

function Brand() {
  return (
    <div className="flex items-center gap-2 px-2 py-2 group-data-[collapsed=true]/sidebar:justify-center group-data-[collapsed=true]/sidebar:px-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
        U
      </span>
      <span className="text-sm font-semibold group-data-[collapsed=true]/sidebar:hidden">
        {t("shell.brand")}
      </span>
    </div>
  );
}

const NAV_GROUPS_KEY = "admin.nav_groups";
const NAV_PARENTS_KEY = "admin.nav_parents";
const LEGACY_NAV_GROUPS_KEY = "admin.nav_groups_closed";
const SIDEBAR_COLLAPSED_KEY = "admin.sidebar_collapsed";

type GroupOverride = "open" | "closed";

/** Manual toggles only; groups without an entry follow the accordion default (active group open). */
function readGroupOverrides(): Record<string, GroupOverride> {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(NAV_GROUPS_KEY) ?? "null",
    );
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      const out: Record<string, GroupOverride> = {};
      for (const [key, value] of Object.entries(
        raw as Record<string, unknown>,
      )) {
        if (value === "open" || value === "closed") out[key] = value;
      }
      return out;
    }
    // One-time migration from the pre-accordion closed-set format.
    const legacy: unknown = JSON.parse(
      localStorage.getItem(LEGACY_NAV_GROUPS_KEY) ?? "null",
    );
    if (Array.isArray(legacy)) {
      const out: Record<string, GroupOverride> = {};
      for (const key of legacy)
        if (typeof key === "string") out[key] = "closed";
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(out));
      localStorage.removeItem(LEGACY_NAV_GROUPS_KEY);
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

/** Same shape/persistence as group overrides, but for second-level parents (Catalog, Posts, …). */
function readParentOverrides(): Record<string, GroupOverride> {
  try {
    const raw: unknown = JSON.parse(
      localStorage.getItem(NAV_PARENTS_KEY) ?? "null",
    );
    if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
      const out: Record<string, GroupOverride> = {};
      for (const [key, value] of Object.entries(
        raw as Record<string, unknown>,
      )) {
        if (value === "open" || value === "closed") out[key] = value;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

/** All parent keys in a subtree — used to prune stale persisted open/close overrides. */
function collectParentKeys(entry: NavEntry): string[] {
  return isNavParent(entry)
    ? [entry.key, ...entry.children.flatMap(collectParentKeys)]
    : [];
}

/** Ancestor parent keys of the active leaf, outermost first — the whole trail auto-expands. */
function activeParentTrail(
  entries: NavEntry[],
  activeTo: string | null,
): string[] {
  if (activeTo === null) return [];
  for (const entry of entries) {
    if (!isNavParent(entry)) continue;
    if (collectLeaves(entry).some((leaf) => leaf.to === activeTo)) {
      return [entry.key, ...activeParentTrail(entry.children, activeTo)];
    }
  }
  return [];
}

/** Icon standing in for a whole group in the two-column rail — the group's first entry icon. */
function groupIcon(group: NavGroup): NavIcon {
  const [first] = group.items;
  return first?.icon ?? LayoutGrid;
}

function SidebarLeaf({
  item,
  collapsed,
  activeTo,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  activeTo: string | null;
  onNavigate?: () => void;
}) {
  // Active state computed here: a className FUNCTION passed to NavLink
  // gets stringified by the Radix Slot (Tooltip asChild) className merge
  const active = item.to === activeTo;
  const link = (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
        collapsed && "justify-center px-0 py-2",
        active
          ? "nav-item-active font-medium"
          : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </NavLink>
  );
  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  ) : (
    link
  );
}

/** Icon-rail flyout entries: leaves are links; a nested parent becomes a submenu. */
function RailMenuItems({
  entries,
  onNavigate,
}: {
  entries: NavEntry[];
  onNavigate?: () => void;
}) {
  return (
    <>
      {entries.map((entry) =>
        isNavParent(entry) ? (
          <DropdownMenuSub key={entry.key}>
            <DropdownMenuSubTrigger>
              <entry.icon className="size-4" />
              {entry.label}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <RailMenuItems entries={entry.children} onNavigate={onNavigate} />
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem key={entry.to} asChild>
            <NavLink to={entry.to} onClick={onNavigate}>
              <entry.icon className="size-4" />
              {entry.label}
            </NavLink>
          </DropdownMenuItem>
        ),
      )}
    </>
  );
}

/**
 * Collapsible node, rendered recursively: a nested parent nests one level deeper
 * (expanded) or opens a submenu (icon rail). Indentation compounds through the
 * child container's logical inset, so RTL mirrors it automatically.
 */
function SidebarParent({
  parent,
  collapsed,
  activeTo,
  isParentOpen,
  onToggleParent,
  onNavigate,
}: {
  parent: NavParent;
  collapsed: boolean;
  activeTo: string | null;
  isParentOpen: (parent: NavParent) => boolean;
  onToggleParent: (parent: NavParent) => void;
  onNavigate?: () => void;
}) {
  const holdsActive = collectLeaves(parent).some(
    (leaf) => leaf.to === activeTo,
  );
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={parent.label}
            className={cn(
              "flex w-full items-center justify-center rounded-lg px-0 py-2 text-sm transition-colors",
              holdsActive
                ? "nav-item-active font-medium"
                : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <parent.icon className="size-4 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>{parent.label}</DropdownMenuLabel>
          <RailMenuItems entries={parent.children} onNavigate={onNavigate} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  const open = isParentOpen(parent);
  return (
    <div>
      <button
        type="button"
        onClick={() => onToggleParent(parent)}
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
          "text-sidebar-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <parent.icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-start">
          {parent.label}
        </span>
        {/* A collapsed parent still signals where the active screen lives. */}
        {!open && holdsActive ? (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
        ) : null}
        <ChevronDown
          className={cn(
            "size-3 shrink-0 transition-transform",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open ? (
        <div className="ms-3 space-y-0.5 border-s border-border/60 ps-1">
          {parent.children.map((child) =>
            isNavParent(child) ? (
              <SidebarParent
                key={child.key}
                parent={child}
                collapsed={false}
                activeTo={activeTo}
                isParentOpen={isParentOpen}
                onToggleParent={onToggleParent}
                onNavigate={onNavigate}
              />
            ) : (
              <SidebarLeaf
                key={child.to}
                item={child}
                collapsed={false}
                activeTo={activeTo}
                onNavigate={onNavigate}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  collapsed = false,
  onNavigate,
  groups: groupsProp,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  /** Restrict the tree to a pre-filtered subset (two-column secondary panel); defaults to all groups. */
  groups?: NavGroup[];
}) {
  const can = usePermissionChecker();
  const { pathname } = useLocation();
  const [overrides, setOverrides] =
    useState<Record<string, GroupOverride>>(readGroupOverrides);
  const [parentOverrides, setParentOverrides] =
    useState<Record<string, GroupOverride>>(readParentOverrides);

  // RBAC filter (recursive): leaves drop by permission; a parent with no permitted descendants disappears.
  const groups = groupsProp ?? filterGroups(can);

  const activeTo = resolveActiveTo(groups, pathname);

  const activeGroupKey = groups.find((group) =>
    group.items.some((entry) =>
      collectLeaves(entry).some((leaf) => leaf.to === activeTo),
    ),
  )?.key;

  // The full chain of ancestor keys, so every parent along the active trail auto-expands.
  const parentTrail = groups.flatMap((group) =>
    activeParentTrail(group.items, activeTo),
  );
  const parentTrailKey = parentTrail.join("\n");
  const activeParentKeys = new Set(parentTrail);

  const isParentOpen = (parent: NavParent): boolean =>
    (parentOverrides[parent.key] ??
      (activeParentKeys.has(parent.key) ? "open" : "closed")) === "open";

  // Drop persisted overrides for keys that no longer exist (e.g. after a nav re-org).
  useEffect(() => {
    const liveKeys = new Set(
      buildNavGroups().flatMap((group) =>
        group.items.flatMap(collectParentKeys),
      ),
    );
    setParentOverrides((current) => {
      const stale = Object.keys(current).filter((key) => !liveKeys.has(key));
      if (stale.length === 0) return current;
      if (import.meta.env.DEV)
        console.warn("[nav] dropping stale parent keys:", stale);
      const next = { ...current };
      for (const key of stale) delete next[key];
      localStorage.setItem(NAV_PARENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Navigating into a manually-closed parent re-opens its whole trail (mirror of the group behavior).
  useEffect(() => {
    if (!parentTrailKey) return;
    setParentOverrides((current) => {
      const next = { ...current };
      let changed = false;
      for (const key of parentTrailKey.split("\n")) {
        if (next[key] === "closed") {
          delete next[key];
          changed = true;
        }
      }
      if (!changed) return current;
      localStorage.setItem(NAV_PARENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, [parentTrailKey]);

  function toggleParent(parent: NavParent) {
    setParentOverrides((current) => {
      const openNow =
        (current[parent.key] ??
          (activeParentKeys.has(parent.key) ? "open" : "closed")) === "open";
      const next: Record<string, GroupOverride> = {
        ...current,
        [parent.key]: openNow ? "closed" : "open",
      };
      localStorage.setItem(NAV_PARENTS_KEY, JSON.stringify(next));
      return next;
    });
  }

  // Accordion default: only the active route's group (and the tiny "main") is open.
  // A lone group (the two-column secondary panel) always defaults open — there is
  // nothing to accordion against.
  const isGroupOpen = (key: string): boolean =>
    groups.length === 1
      ? (overrides[key] ?? "open") === "open"
      : (overrides[key] ??
          (key === activeGroupKey || key === "main" ? "open" : "closed")) ===
        "open";

  // Navigating into a manually-closed group re-opens it (drop the override, keep others).
  useEffect(() => {
    if (!activeGroupKey) return;
    setOverrides((current) => {
      if (current[activeGroupKey] !== "closed") return current;
      const next = { ...current };
      delete next[activeGroupKey];
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }, [activeGroupKey]);

  function toggleGroup(key: string) {
    setOverrides((current) => {
      const openNow =
        (current[key] ??
          (key === activeGroupKey || key === "main" ? "open" : "closed")) ===
        "open";
      const next: Record<string, GroupOverride> = {
        ...current,
        [key]: openNow ? "closed" : "open",
      };
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <nav
      aria-label={t("shell.nav_label")}
      className={cn(
        "scrollbar-hover mt-2 flex-1 space-y-2 overflow-y-auto overflow-x-hidden",
        // Icons-only mode: hide the bar (wheel still scrolls) and add breathing room
        // so hover pills / focus rings are not flush against the clipped rail edges
        collapsed && "scrollbar-none px-1 py-1",
      )}
    >
      {groups.map((group) => {
        const closed = !collapsed && !isGroupOpen(group.key);
        const holdsActive = group.key === activeGroupKey;
        return (
          <div key={group.key}>
            {collapsed ? (
              <div className="mx-auto mb-1 h-px w-6 bg-border" />
            ) : (
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                aria-expanded={!closed}
                className="flex w-full items-center justify-between rounded-md px-3 py-1 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <span className="flex items-center gap-1.5">
                  {group.label}
                  {/* A closed group still signals where the active screen lives. */}
                  {closed && holdsActive ? (
                    <span className="size-1.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3 transition-transform",
                    closed && "-rotate-90",
                  )}
                />
              </button>
            )}
            {closed ? null : (
              <div className="space-y-0.5">
                {group.items.map((entry) =>
                  isNavParent(entry) ? (
                    <SidebarParent
                      key={entry.key}
                      parent={entry}
                      collapsed={collapsed}
                      activeTo={activeTo}
                      isParentOpen={isParentOpen}
                      onToggleParent={toggleParent}
                      onNavigate={onNavigate}
                    />
                  ) : (
                    <SidebarLeaf
                      key={entry.to}
                      item={entry}
                      collapsed={collapsed}
                      activeTo={activeTo}
                      onNavigate={onNavigate}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** Below md the palette opens from a plain icon button (no inline field). */
function MobilePaletteButton({
  className = "md:hidden",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        aria-label={t("shell.searchPlaceholder")}
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Maintenance + impersonation banners (UI:shell-auth §2) — pinned on every screen. */
function ShellBanners() {
  const { me, refresh } = useAuth();
  const canManageSettings = useCan("settings.manage");
  const [stopping, setStopping] = useState(false);

  async function stopImpersonation() {
    setStopping(true);
    try {
      await api.auth.stopImpersonation();
      await refresh();
    } finally {
      setStopping(false);
    }
  }

  return (
    <>
      {me.maintenance_mode !== "off" ? (
        <div className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--status-pending-fg)]/30 bg-[var(--status-pending-bg)] px-4 py-2 text-sm text-[var(--status-pending-fg)] sm:mx-4">
          <span>
            {t(
              me.maintenance_mode === "full"
                ? "banner.maintenance_full"
                : "banner.maintenance_read_only",
            )}
          </span>
          {canManageSettings ? (
            <NavLink
              to="/settings/site"
              className="shrink-0 font-medium underline underline-offset-2"
            >
              {t("banner.maintenance_settings")}
            </NavLink>
          ) : null}
        </div>
      ) : null}
      {me.impersonator ? (
        <div className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm sm:mx-4">
          <span>
            {t("banner.impersonation", {
              name: me.user.name,
              role: roleDisplayName(me.user.role),
            })}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={stopImpersonation}
            disabled={stopping}
          >
            <RefreshCw className={cn("size-3.5", stopping && "animate-spin")} />
            {t("banner.impersonation_stop")}
          </Button>
        </div>
      ) : null}
    </>
  );
}

/** Subtle mesh parallax (E1 §2.3): the background drifts ~12% slower than content. */
function useMeshParallax() {
  const meshRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = meshRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // Clamp so the mesh (140vh tall) never lifts above the viewport bottom on long pages
        const maxShift = window.innerHeight * 0.4 - 8;
        el.style.transform = `translateY(-${Math.min(window.scrollY * 0.12, Math.max(maxShift, 0))}px)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return meshRef;
}

function useDarkMode() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("admin.theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("admin.theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((value) => !value) };
}

/** Compact brand shown in the topbar for the header-first layouts (horizontal / detached). */
function HeaderBrand() {
  return (
    <div className="hidden items-center gap-2 pe-1 lg:flex">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
        U
      </span>
      <span className="text-sm font-semibold">{t("shell.brand")}</span>
    </div>
  );
}

/** The burger + slide-in nav drawer — the shared below-`lg` navigation for every layout. */
function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t("shell.brand")}
        >
          <Menu />
        </Button>
      </SheetTrigger>
      {/* Full width on phones; capped from sm up */}
      <SheetContent
        side="left"
        className="flex flex-col p-3 data-[side=left]:w-full data-[side=left]:sm:max-w-sm"
      >
        <SheetTitle className="sr-only">{t("shell.brand")}</SheetTitle>
        <Brand />
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

/** Right-aligned topbar cluster (E5): notifications, AI, locale, skin, theme, open-site, user. */
function TopbarControls({
  dark,
  onToggleDark,
  effectiveStyle,
  onCycleStyle,
}: {
  dark: boolean;
  onToggleDark: () => void;
  effectiveStyle: AppearanceStyle;
  onCycleStyle: () => void;
}) {
  const locale = useLocale();
  const { me, logout } = useAuth();
  // Typed demo seed so the type tabs are demonstrable; the bell badge is derived
  // from the unread items inside NotificationsMenu, so it stays consistent.
  // Real data will replace this via a GET /api/notifications hook.
  const notifications: AdminNotification[] = [
    {
      id: "n1",
      type: "mention",
      title: t("notifications.seed.mentionComment"),
      time: "2m",
      read: false,
    },
    {
      id: "n2",
      type: "mention",
      title: t("notifications.seed.taskAssigned"),
      time: "18m",
      read: true,
    },
    {
      id: "n3",
      type: "system",
      title: t("notifications.seed.systemMaintenance"),
      time: "1h",
      read: false,
    },
    {
      id: "n4",
      type: "system",
      title: t("notifications.seed.newVersion"),
      time: "3h",
      read: true,
    },
  ];

  return (
    <div className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
      <NotificationsMenu initialItems={notifications} />
      <AiPanel />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="sm:w-auto sm:gap-2 sm:px-3"
            aria-label={LOCALE_NAMES[locale]}
          >
            <Globe />
            <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={(value) => setLocale(value as AdminLocale)}
          >
            {ADMIN_LOCALES.map((code) => (
              <DropdownMenuRadioItem key={code} value={code}>
                {LOCALE_NAMES[code]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="icon"
        onClick={onCycleStyle}
        aria-label={t("shell.skin")}
        title={t("shell.skin")}
      >
        {effectiveStyle === "liquid" ? (
          <Sparkles />
        ) : effectiveStyle === "flat" ? (
          <Square />
        ) : (
          <Droplet />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleDark}
        aria-label={t("shell.theme")}
      >
        {dark ? <Sun /> : <Moon />}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="max-sm:size-[32px] max-sm:px-0"
        aria-label={t("shell.openSite")}
        asChild
      >
        <a href="/" target="_blank" rel="noopener">
          <ExternalLink />
          <span className="hidden md:inline">{t("shell.openSite")}</span>
        </a>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("shell.profile")}>
            <User />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <span className="block">{me.user.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">
              {roleDisplayName(me.user.role)}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <NavLink to="/profile">
              <UserCircle />
              {t("shell.profile")}
            </NavLink>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void logout()}>
            <LogOut />
            {t("shell.logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * The glass topbar (E5). `leading` injects the brand for the sidebar-less layouts.
 * `nav` embeds the horizontal menu inline (single-topbar layout). `searchAsIcon`
 * collapses the search field to an always-visible icon (for the horizontal layout,
 * where the inline menu owns the middle space).
 */
function ShellHeader({
  dark,
  onToggleDark,
  effectiveStyle,
  onCycleStyle,
  leading,
  nav,
  searchAsIcon = false,
}: {
  dark: boolean;
  onToggleDark: () => void;
  effectiveStyle: AppearanceStyle;
  onCycleStyle: () => void;
  leading?: ReactNode;
  nav?: ReactNode;
  searchAsIcon?: boolean;
}) {
  return (
    <header className="glass-header sticky top-2 z-20 m-2 mb-0 flex items-center gap-1.5 rounded-2xl border p-2 sm:top-4 sm:m-4 sm:mb-0 sm:gap-2">
      <MobileNavSheet />
      {leading}
      {nav}
      {/* Search field-styled trigger ≥md; an icon below md — both open the ⌘K palette.
          searchAsIcon forces the icon-only form at every width. */}
      {searchAsIcon ? null : (
        <CommandPaletteTrigger className="hidden flex-1 md:flex md:max-w-md" />
      )}
      <MobilePaletteButton className={searchAsIcon ? "" : "md:hidden"} />
      <TopbarControls
        dark={dark}
        onToggleDark={onToggleDark}
        effectiveStyle={effectiveStyle}
        onCycleStyle={onCycleStyle}
      />
    </header>
  );
}

/** `.app-main` is the stable hook for the boxed content-width rule (index.css). */
function MainOutlet({
  className,
  padded = true,
}: {
  className?: string;
  padded?: boolean;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        "app-main min-w-0 flex-1 outline-none",
        padded && "p-3 sm:p-4 md:p-6",
        className,
      )}
    >
      <Outlet />
    </main>
  );
}

/** Default vertical shell: full-height glass sidebar, collapsible to an icon rail. */
function VerticalSidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
  );
  function toggleCollapsed() {
    setCollapsed((value) => {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? "" : "1");
      return !value;
    });
  }
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "glass-panel group/sidebar sticky top-4 m-4 me-0 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-2xl p-3 transition-[width] lg:flex",
        collapsed ? "w-16 items-stretch" : "w-60",
      )}
    >
      <Brand />
      <SidebarNav collapsed={collapsed} />
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleCollapsed}
        aria-label={t(
          collapsed ? "shell.sidebar_expand" : "shell.sidebar_collapse",
        )}
        className={cn("mt-2", collapsed ? "self-center" : "self-end")}
      >
        {/* Sidebar-collapse icons imply a start-docked panel; mirror under RTL. */}
        {collapsed ? (
          <PanelLeftOpen className="rtl:-scale-x-100" />
        ) : (
          <PanelLeftClose className="rtl:-scale-x-100" />
        )}
      </Button>
    </aside>
  );
}

/**
 * Hovered variant: collapsed to icons, expands on pointer hover AND keyboard focus-within
 * (a11y — never hover-only). `onFocus`/`onBlur` bubble, so tabbing into any link expands it.
 */
function HoverSidebar() {
  const [expanded, setExpanded] = useState(false);
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- hover only reveals labels; the nav stays fully keyboard-operable via focus-within (onFocus/onBlur), so the pointer handlers are pure progressive enhancement
    <aside
      data-collapsed={!expanded}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null))
          setExpanded(false);
      }}
      className={cn(
        "glass-panel group/sidebar sticky top-4 m-4 me-0 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-2xl p-3 transition-[width] lg:flex",
        expanded ? "w-60" : "w-16 items-stretch",
      )}
    >
      <Brand />
      <SidebarNav collapsed={!expanded} />
    </aside>
  );
}

/** Detached variant: a floating sidebar card that sits inside the boxed content row. */
function DetachedSidebar() {
  return (
    <aside className="glass-panel sticky top-24 hidden h-[calc(100vh-8rem)] w-60 shrink-0 flex-col rounded-2xl p-3 lg:flex">
      <SidebarNav />
    </aside>
  );
}

/**
 * Two-column variant: a narrow icon rail of top-level groups + a secondary panel showing the
 * selected group's tree. The rail follows the active route until the user picks a group.
 */
function TwoColumnNav() {
  const { groups, activeGroupKey } = useActiveNav();
  const [selected, setSelected] = useState<string | undefined>(activeGroupKey);
  const userPicked = useRef(false);
  // Follow the active route's group unless the user has manually selected another rail entry.
  useEffect(() => {
    if (!userPicked.current) setSelected(activeGroupKey);
  }, [activeGroupKey]);
  const current =
    groups.find((group) => group.key === (selected ?? activeGroupKey)) ??
    groups[0];
  return (
    <>
      <aside className="glass-panel sticky top-4 m-4 me-0 hidden h-[calc(100vh-2rem)] w-16 shrink-0 flex-col items-center gap-1 rounded-2xl p-2 lg:flex">
        <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
          U
        </span>
        {groups.map((group) => {
          const Icon = groupIcon(group);
          const active = group.key === current?.key;
          return (
            <Tooltip key={group.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={group.label}
                  aria-pressed={active}
                  onClick={() => {
                    userPicked.current = true;
                    setSelected(group.key);
                  }}
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "nav-item-active"
                      : "text-sidebar-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{group.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
      <aside className="glass-panel sticky top-4 m-4 me-0 hidden h-[calc(100vh-2rem)] w-56 shrink-0 flex-col rounded-2xl p-3 lg:flex">
        {current ? <SidebarNav groups={[current]} /> : null}
      </aside>
    </>
  );
}

export function AppShell() {
  const { dark, toggle } = useDarkMode();
  // Site-wide appearance (E1 §2.2.1) applied to <html>; topbar button quick-cycles the style.
  // clearOverride lets the Theme Customizer drop the transient style preview on commit.
  // dir feeds the Radix DirectionProvider so overlays (menus, selects, sliders) mirror in RTL.
  // layout selects the shell chrome; below `lg` every variant is the burger drawer.
  const { effectiveStyle, dir, cycleStyle, clearOverride, layout } =
    useAppearance();
  const meshRef = useMeshParallax();

  const headerProps = {
    dark,
    onToggleDark: toggle,
    effectiveStyle,
    onCycleStyle: cycleStyle,
  };

  let chrome: ReactNode;
  if (layout === "horizontal") {
    chrome = (
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader
          {...headerProps}
          leading={<HeaderBrand />}
          nav={<HorizontalNav />}
          searchAsIcon
        />
        <ShellBanners />
        <MainOutlet />
      </div>
    );
  } else if (layout === "detached") {
    chrome = (
      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader {...headerProps} leading={<HeaderBrand />} />
        <ShellBanners />
        <div className="mx-auto flex w-full max-w-[88rem] gap-4 px-2 pb-2 sm:px-4">
          <DetachedSidebar />
          <MainOutlet padded={false} className="py-3 sm:py-4 md:py-6" />
        </div>
      </div>
    );
  } else {
    // vertical | hovered | two-column: an outer sidebar/rail beside the standard content column.
    const sidebar =
      layout === "hovered" ? (
        <HoverSidebar />
      ) : layout === "two-column" ? (
        <TwoColumnNav />
      ) : (
        <VerticalSidebar />
      );
    chrome = (
      <>
        {sidebar}
        <div className="flex min-w-0 flex-1 flex-col">
          <ShellHeader {...headerProps} />
          <ShellBanners />
          <MainOutlet />
        </div>
      </>
    );
  }

  return (
    <DirectionProvider dir={dir}>
      <div className="flex min-h-screen">
        {/* Skip link (WCAG 2.4.1): first tab stop, jumps past the sidebar/topbar to <main>.
          Visually hidden until focused. */}
        <a
          href="#main-content"
          className="sr-only rounded-lg focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("shell.skip_to_content")}
        </a>
        {/* Mesh background layers — painted once for the whole SPA (E1 §2.1, §2.3).
          The mesh is taller than the viewport so the parallax shift never reveals its edge. */}
        <div
          ref={meshRef}
          aria-hidden
          className="app-mesh fixed inset-x-0 top-0 -z-10 h-[140vh]"
        />
        <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
        <div
          aria-hidden
          className="app-mesh-grid fixed inset-x-0 top-0 -z-10 h-[420px]"
        />
        <GlobalProgress />

        {chrome}

        {/* Theme Customizer (W0.5): global drawer reachable from every screen via a floating
          trigger. Dark mode is shared (not forked) so the topbar sun/moon stays in sync;
          RTL-aware via the logical `end` inset. */}
        <ThemeCustomizer
          dark={dark}
          onToggleDark={toggle}
          onClearStyleOverride={clearOverride}
          trigger={
            <Button
              size="icon"
              aria-label={t("customizer.open")}
              title={t("customizer.open")}
              className="fixed bottom-4 end-4 z-30 size-11 rounded-full shadow-lg"
            >
              <SlidersHorizontal />
            </Button>
          }
        />
      </div>
    </DirectionProvider>
  );
}
