import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'

import { api } from '@/api'
import { buildNavGroups, buildQuickActions, flattenNavItems } from '@/app/nav'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Kbd } from '@/components/ui/kbd'
import { useAuth } from '@/lib/auth'
import { t } from '@/lib/i18n'
import { usePermissionChecker } from '@/lib/permissions'
import { cn } from '@/lib/utils'

/*
 * ⌘K palette (UI:shell-auth §2, E2 §5a): navigation + quick actions are local
 * (route map × permissions, instant); content results come from
 * GET /api/admin-search (debounce 300ms, 2+ chars, top-5 per group, drafts
 * badged). Enter navigates. There is no separate results page by design.
 */

function useDebounced(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { me } = useAuth()
  const can = usePermissionChecker()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query.trim(), 300)

  const navItems = useMemo(
    () => flattenNavItems(buildNavGroups()).filter((item) => can(item.perm)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me],
  )
  const actions = buildQuickActions().filter((action) => can(action.perm))

  const contentQuery = useQuery({
    queryKey: ['admin-search', debouncedQuery],
    queryFn: () => api.adminSearch(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30_000,
  })
  const groups = debouncedQuery.length >= 2 ? (contentQuery.data?.groups ?? []) : []

  function go(url: string) {
    onOpenChange(false)
    setQuery('')
    navigate(url)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t('palette.title')} showCloseButton={false}>
      <Command>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={t('palette.placeholder')}
        />
      <CommandList>
        <CommandEmpty>{t('palette.empty')}</CommandEmpty>
        <CommandGroup heading={t('palette.navigation')}>
          {navItems.map((item) => (
            <CommandItem key={item.to} value={`nav ${item.label}`} onSelect={() => go(item.to)}>
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {actions.length > 0 ? (
          <CommandGroup heading={t('palette.actions')}>
            {actions.map((action) => (
              <CommandItem key={action.to} value={`action ${action.label}`} onSelect={() => go(action.to)}>
                <action.icon className="size-4" />
                {action.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {groups.map((group) => (
          <CommandGroup key={group.key} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.url}
                /* Server already matched the query — bypass cmdk's own filter. */
                value={`${debouncedQuery} ${item.title}`}
                onSelect={() => go(item.url)}
              >
                <span className="min-w-0 truncate">{item.title}</span>
                {item.status === 'draft' ? (
                  <Badge variant="secondary" className="ml-auto shrink-0">
                    {t('common.draft')}
                  </Badge>
                ) : item.hint ? (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{item.hint}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {contentQuery.isFetching ? (
          <>
            <CommandSeparator />
            <p className="px-3 py-2 text-xs text-muted-foreground">{t('palette.searching')}</p>
          </>
        ) : null}
      </CommandList>
      </Command>
    </CommandDialog>
  )
}

/** Topbar trigger styled as a search field; global hotkey ⌘K / Ctrl+K. */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 items-center gap-2 rounded-lg border border-transparent bg-muted/60 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground',
          className,
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{t('shell.searchPlaceholder')}</span>
        <Kbd className="max-sm:hidden">⌘K</Kbd>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}
