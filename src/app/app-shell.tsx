import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  ChevronDown,
  Droplet,
  ExternalLink,
  Globe,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  Sun,
  User,
  UserCircle,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'

import { api } from '@/api'
import { buildNavGroups, isNavParent, type NavItem, type NavParent } from '@/app/nav'
import { Button } from '@/components/ui/button'
import { AiPanel } from '@/components/ai-panel'
import { CommandPalette, CommandPaletteTrigger } from '@/components/command-palette'
import { GlobalProgress } from '@/components/global-progress'
import { NotificationsMenu } from '@/components/notifications-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAppearance } from '@/lib/appearance'
import { useAuth } from '@/lib/auth'
import { ADMIN_LOCALES, LOCALE_NAMES, setLocale, t, type AdminLocale } from '@/lib/i18n'
import { useCan, usePermissionChecker } from '@/lib/permissions'
import { useLocale } from '@/lib/use-locale'
import { cn } from '@/lib/utils'

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
      <span className="text-sm font-semibold group-data-[collapsed=true]/sidebar:hidden">{t('shell.brand')}</span>
    </div>
  )
}

const NAV_GROUPS_KEY = 'admin.nav_groups'
const NAV_PARENTS_KEY = 'admin.nav_parents'
const LEGACY_NAV_GROUPS_KEY = 'admin.nav_groups_closed'
const SIDEBAR_COLLAPSED_KEY = 'admin.sidebar_collapsed'

type GroupOverride = 'open' | 'closed'

/** Manual toggles only; groups without an entry follow the accordion default (active group open). */
function readGroupOverrides(): Record<string, GroupOverride> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(NAV_GROUPS_KEY) ?? 'null')
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      const out: Record<string, GroupOverride> = {}
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (value === 'open' || value === 'closed') out[key] = value
      }
      return out
    }
    // One-time migration from the pre-accordion closed-set format.
    const legacy: unknown = JSON.parse(localStorage.getItem(LEGACY_NAV_GROUPS_KEY) ?? 'null')
    if (Array.isArray(legacy)) {
      const out: Record<string, GroupOverride> = {}
      for (const key of legacy) if (typeof key === 'string') out[key] = 'closed'
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(out))
      localStorage.removeItem(LEGACY_NAV_GROUPS_KEY)
      return out
    }
    return {}
  } catch {
    return {}
  }
}

/** Same shape/persistence as group overrides, but for second-level parents (Catalog, Posts, …). */
function readParentOverrides(): Record<string, GroupOverride> {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(NAV_PARENTS_KEY) ?? 'null')
    if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
      const out: Record<string, GroupOverride> = {}
      for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
        if (value === 'open' || value === 'closed') out[key] = value
      }
      return out
    }
    return {}
  } catch {
    return {}
  }
}

function matchesPath(item: { to: string }, pathname: string): boolean {
  return item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`)
}

/** Only the DEEPEST matching leaf is active — /c/products must not light up on /c/products/categories. */
function resolveActiveTo(groups: { items: (NavItem | NavParent)[] }[], pathname: string): string | null {
  let best: string | null = null
  for (const group of groups) {
    for (const entry of group.items) {
      for (const item of isNavParent(entry) ? entry.children : [entry]) {
        if (matchesPath(item, pathname) && (best === null || item.to.length > best.length)) best = item.to
      }
    }
  }
  return best
}

function SidebarLeaf({
  item,
  collapsed,
  indent = false,
  activeTo,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  indent?: boolean
  activeTo: string | null
  onNavigate?: () => void
}) {
  // Active state computed here: a className FUNCTION passed to NavLink
  // gets stringified by the Radix Slot (Tooltip asChild) className merge
  const active = item.to === activeTo
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
        collapsed && 'justify-center px-0 py-2',
        !collapsed && indent && 'ml-4',
        active
          ? 'nav-item-active font-medium'
          : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {collapsed ? null : <span className="truncate">{item.label}</span>}
    </NavLink>
  )
  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  ) : (
    link
  )
}

/** Second-level node: collapsible sub-tree expanded, flyout menu in the icon rail (shell contract). */
function SidebarParent({
  parent,
  collapsed,
  activeTo,
  open,
  onToggle,
  onNavigate,
}: {
  parent: NavParent
  collapsed: boolean
  activeTo: string | null
  open: boolean
  onToggle: () => void
  onNavigate?: () => void
}) {
  const holdsActive = parent.children.some((child) => child.to === activeTo)
  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={parent.label}
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-0 py-2 text-sm transition-colors',
              holdsActive
                ? 'nav-item-active font-medium'
                : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <parent.icon className="size-4 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuLabel>{parent.label}</DropdownMenuLabel>
          {parent.children.map((child) => (
            <DropdownMenuItem key={child.to} asChild>
              <NavLink to={child.to} onClick={onNavigate}>
                <child.icon className="size-4" />
                {child.label}
              </NavLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
          'text-sidebar-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <parent.icon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{parent.label}</span>
        {/* A collapsed parent still signals where the active screen lives. */}
        {!open && holdsActive ? <span className="size-1.5 shrink-0 rounded-full bg-primary" /> : null}
        <ChevronDown className={cn('size-3 shrink-0 transition-transform', !open && '-rotate-90')} />
      </button>
      {open ? (
        <div className="space-y-0.5">
          {parent.children.map((child) => (
            <SidebarLeaf key={child.to} item={child} collapsed={false} indent activeTo={activeTo} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { me } = useAuth()
  const can = usePermissionChecker()
  const { pathname } = useLocation()
  const [overrides, setOverrides] = useState<Record<string, GroupOverride>>(readGroupOverrides)
  const [parentOverrides, setParentOverrides] = useState<Record<string, GroupOverride>>(readParentOverrides)

  // RBAC filter: children first, then parents with no permitted children disappear.
  const groups = buildNavGroups(me)
    .map((group) => ({
      ...group,
      items: group.items
        .map((entry) =>
          isNavParent(entry) ? { ...entry, children: entry.children.filter((child) => can(child.perm)) } : entry,
        )
        .filter((entry) => (isNavParent(entry) ? entry.children.length > 0 : can(entry.perm))),
    }))
    .filter((group) => group.items.length > 0)

  const activeTo = resolveActiveTo(groups, pathname)

  const activeGroupKey = groups.find((group) =>
    group.items.some((entry) =>
      isNavParent(entry) ? entry.children.some((child) => child.to === activeTo) : entry.to === activeTo,
    ),
  )?.key

  const activeParentKey = groups
    .flatMap((group) => group.items)
    .filter(isNavParent)
    .find((parent) => parent.children.some((child) => child.to === activeTo))?.key

  const isParentOpen = (parent: NavParent): boolean =>
    (parentOverrides[parent.key] ?? (parent.key === activeParentKey ? 'open' : 'closed')) === 'open'

  // Navigating into a manually-closed parent re-opens it (mirror of the group behavior).
  useEffect(() => {
    if (!activeParentKey) return
    setParentOverrides((current) => {
      if (current[activeParentKey] !== 'closed') return current
      const next = { ...current }
      delete next[activeParentKey]
      localStorage.setItem(NAV_PARENTS_KEY, JSON.stringify(next))
      return next
    })
  }, [activeParentKey])

  function toggleParent(parent: NavParent) {
    setParentOverrides((current) => {
      const openNow = (current[parent.key] ?? (parent.key === activeParentKey ? 'open' : 'closed')) === 'open'
      const next: Record<string, GroupOverride> = { ...current, [parent.key]: openNow ? 'closed' : 'open' }
      localStorage.setItem(NAV_PARENTS_KEY, JSON.stringify(next))
      return next
    })
  }

  // Accordion default: only the active route's group (and the tiny "main") is open.
  const isGroupOpen = (key: string): boolean =>
    (overrides[key] ?? (key === activeGroupKey || key === 'main' ? 'open' : 'closed')) === 'open'

  // Navigating into a manually-closed group re-opens it (drop the override, keep others).
  useEffect(() => {
    if (!activeGroupKey) return
    setOverrides((current) => {
      if (current[activeGroupKey] !== 'closed') return current
      const next = { ...current }
      delete next[activeGroupKey]
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next))
      return next
    })
  }, [activeGroupKey])

  function toggleGroup(key: string) {
    setOverrides((current) => {
      const openNow = (current[key] ?? (key === activeGroupKey || key === 'main' ? 'open' : 'closed')) === 'open'
      const next: Record<string, GroupOverride> = { ...current, [key]: openNow ? 'closed' : 'open' }
      localStorage.setItem(NAV_GROUPS_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <nav
      className={cn(
        'scrollbar-hover mt-2 flex-1 space-y-2 overflow-y-auto overflow-x-hidden',
        // Icons-only mode: hide the bar (wheel still scrolls) and add breathing room
        // so hover pills / focus rings are not flush against the clipped rail edges
        collapsed && 'scrollbar-none px-1 py-1',
      )}
    >
      {groups.map((group) => {
        const closed = !collapsed && !isGroupOpen(group.key)
        const holdsActive = group.key === activeGroupKey
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
                  {closed && holdsActive ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                </span>
                <ChevronDown className={cn('size-3 transition-transform', closed && '-rotate-90')} />
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
                      open={isParentOpen(entry)}
                      onToggle={() => toggleParent(entry)}
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
        )
      })}
    </nav>
  )
}

/** Below md the palette opens from a plain icon button (no inline field). */
function MobilePaletteButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t('shell.searchPlaceholder')}
        onClick={() => setOpen(true)}
      >
        <Search />
      </Button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}

/** Maintenance + impersonation banners (UI:shell-auth §2) — pinned on every screen. */
function ShellBanners() {
  const { me, refresh } = useAuth()
  const canManageSettings = useCan('settings.manage')
  const [stopping, setStopping] = useState(false)

  async function stopImpersonation() {
    setStopping(true)
    try {
      await api.auth.stopImpersonation()
      await refresh()
    } finally {
      setStopping(false)
    }
  }

  return (
    <>
      {me.maintenance_mode !== 'off' ? (
        <div className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-xl border border-[var(--status-pending-fg)]/30 bg-[var(--status-pending-bg)] px-4 py-2 text-sm text-[var(--status-pending-fg)] sm:mx-4">
          <span>
            {t(me.maintenance_mode === 'full' ? 'banner.maintenance_full' : 'banner.maintenance_read_only')}
          </span>
          {canManageSettings ? (
            <NavLink to="/settings/site" className="shrink-0 font-medium underline underline-offset-2">
              {t('banner.maintenance_settings')}
            </NavLink>
          ) : null}
        </div>
      ) : null}
      {me.impersonator ? (
        <div className="mx-2 mt-2 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm sm:mx-4">
          <span>{t('banner.impersonation', { name: me.user.name, role: me.user.role.label })}</span>
          <Button size="sm" variant="outline" onClick={stopImpersonation} disabled={stopping}>
            <RefreshCw className={cn('size-3.5', stopping && 'animate-spin')} />
            {t('banner.impersonation_stop')}
          </Button>
        </div>
      ) : null}
    </>
  )
}

/** Subtle mesh parallax (E1 §2.3): the background drifts ~12% slower than content. */
function useMeshParallax() {
  const meshRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = meshRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        // Clamp so the mesh (140vh tall) never lifts above the viewport bottom on long pages
        const maxShift = window.innerHeight * 0.4 - 8
        el.style.transform = `translateY(-${Math.min(window.scrollY * 0.12, Math.max(maxShift, 0))}px)`
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
  return meshRef
}

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('admin.theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('admin.theme', dark ? 'dark' : 'light')
  }, [dark])
  return { dark, toggle: () => setDark((value) => !value) }
}

export function AppShell() {
  const locale = useLocale()
  const { me, logout } = useAuth()
  const { dark, toggle } = useDarkMode()
  // Site-wide appearance (E1 §2.2.1) applied to <html>; topbar button quick-cycles the style.
  const { effectiveStyle, cycleStyle } = useAppearance()
  const meshRef = useMeshParallax()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')

  const unreadQuery = useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: api.notifications.unreadCount })
  const unread = unreadQuery.data?.count ?? 0

  function toggleCollapsed() {
    setCollapsed((value) => {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? '' : '1')
      return !value
    })
  }

  return (
    <div className="flex min-h-screen">
      {/* Mesh background layers — painted once for the whole SPA (E1 §2.1, §2.3).
          The mesh is taller than the viewport so the parallax shift never reveals its edge. */}
      <div ref={meshRef} aria-hidden className="app-mesh fixed inset-x-0 top-0 -z-10 h-[140vh]" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-grid fixed inset-x-0 top-0 -z-10 h-[420px]" />
      <GlobalProgress />

      {/* Sidebar (glass, blur 28) — desktop only; below lg it lives in the burger Sheet */}
      <aside
        data-collapsed={collapsed}
        className={cn(
          'glass-panel group/sidebar sticky top-4 m-4 mr-0 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-2xl p-3 transition-[width] lg:flex',
          collapsed ? 'w-16 items-stretch' : 'w-60',
        )}
      >
        <Brand />
        <SidebarNav collapsed={collapsed} />
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          aria-label={t(collapsed ? 'shell.sidebar_expand' : 'shell.sidebar_collapse')}
          className={cn('mt-2', collapsed ? 'self-center' : 'self-end')}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar (glass, blur 26): burger (mobile), search, bell, AI, UI locale, theme,
            open site, user (E5). p-2 keeps the search inset equal on top/bottom/left. */}
        <header className="glass-header sticky top-2 z-10 m-2 mb-0 flex items-center gap-1.5 rounded-2xl border p-2 sm:top-4 sm:m-4 sm:mb-0 sm:gap-2">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={t('shell.brand')}>
                <Menu />
              </Button>
            </SheetTrigger>
            {/* Full width on phones; capped from sm up */}
            <SheetContent
              side="left"
              className="flex flex-col p-3 data-[side=left]:w-full data-[side=left]:sm:max-w-sm"
            >
              <SheetTitle className="sr-only">{t('shell.brand')}</SheetTitle>
              <Brand />
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          {/* Search field-styled trigger ≥md; an icon below md — both open the ⌘K palette */}
          <CommandPaletteTrigger className="hidden flex-1 md:flex md:max-w-md" />
          <MobilePaletteButton />
          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
            <NotificationsMenu
              initialItems={Array.from({ length: unread }, (_, index) => ({
                id: `unread-${index}`,
                title: t('bell.placeholder'),
                time: '',
                read: false,
              }))}
            />
            <AiPanel />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:w-auto sm:gap-2 sm:px-3" aria-label={LOCALE_NAMES[locale]}>
                  <Globe />
                  <span className="hidden sm:inline">{LOCALE_NAMES[locale]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as AdminLocale)}>
                  {ADMIN_LOCALES.map((code) => (
                    <DropdownMenuRadioItem key={code} value={code}>
                      {LOCALE_NAMES[code]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={cycleStyle} aria-label={t('shell.skin')} title={t('shell.skin')}>
              {effectiveStyle === 'liquid' ? <Sparkles /> : effectiveStyle === 'flat' ? <Square /> : <Droplet />}
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label={t('shell.theme')}>
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="max-sm:size-[32px] max-sm:px-0"
              aria-label={t('shell.openSite')}
              asChild
            >
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink />
                <span className="hidden md:inline">{t('shell.openSite')}</span>
              </a>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={t('shell.profile')}>
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="block">{me.user.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{me.user.role.label}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/profile">
                    <UserCircle />
                    {t('shell.profile')}
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void logout()}>
                  <LogOut />
                  {t('shell.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <ShellBanners />

        <main className="min-w-0 flex-1 p-3 sm:p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
