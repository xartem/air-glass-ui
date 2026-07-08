import { useEffect, type ComponentType, type ReactNode } from 'react'
import { ChevronLeft, Save } from 'lucide-react'
import { Link, useBlocker } from 'react-router'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * EditorLayout (E6 §1B, §3.1):
 * <EditorLayout back title status? tabs sidebar? primaryAction dangerZone? dirty />
 * Skeleton is law: back top-left · primary action top-right AND duplicated in the sticky
 * bottom bar · tabs in fixed order (Content → … → SEO → Languages) · delete NEVER next
 * to Save — it goes into dangerZone (bottom-left), always behind a ConfirmDialog.
 * Handles the dirty guard (E4 §1) and Ctrl/Cmd+S itself.
 */

export type EditorTab = {
  key: string
  label: string
  content: ReactNode
  icon?: ComponentType<{ className?: string }>
}

export function EditorLayout({
  back,
  title,
  status,
  tabs,
  sidebar,
  primaryAction,
  dangerZone,
  dirty = false,
  className,
}: {
  back: { href: string }
  title: string
  status?: StatusKind
  tabs: EditorTab[]
  sidebar?: ReactNode
  primaryAction: { label: string; onClick: () => void; disabled?: boolean }
  /** Destructive controls (delete button wrapped in ConfirmDialog). Rendered bottom-left. */
  dangerZone?: ReactNode
  dirty?: boolean
  className?: string
}) {
  // Dirty guard (E4 §1): warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // [FIX] beforeunload alone never guarded in-SPA navigation (back link,
  // sidebar): route-level blocker + ConfirmDialog, same as settings-page.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  // Ctrl/Cmd+S saves (E4).
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        if (!primaryAction.disabled) primaryAction.onClick()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [primaryAction])

  return (
    <div data-slot="editor-layout" className={cn('flex min-h-full flex-col gap-4', className)}>
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" asChild aria-label={t('common.back')}>
            <Link to={back.href}>
              <ChevronLeft />
            </Link>
          </Button>
          <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
          {status ? <StatusBadge status={status} /> : null}
        </div>
        <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
          <Save />
          {primaryAction.label}
        </Button>
      </header>

      {/* Sidebar stacks under the form below lg (E1 §4) */}
      <div className="flex flex-1 flex-col items-stretch gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <Tabs defaultValue={tabs[0]?.key}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.icon ? <tab.icon className="size-4" /> : null}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.key} value={tab.key} className="pt-4">
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        {sidebar ? <aside className="w-full shrink-0 lg:w-72">{sidebar}</aside> : null}
      </div>

      {/* Sticky bottom bar duplicates Save; danger zone lives far left (E6 §1B) */}
      <div className="glass-header sticky bottom-0 -mx-1 mt-auto flex items-center justify-between gap-4 rounded-lg border-t-0 px-3 py-2.5">
        <div>{dangerZone}</div>
        <div className="flex items-center gap-3">
          {dirty ? <span className="text-xs text-muted-foreground">{t('editor.unsaved')}</span> : null}
          <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
            <Save />
            {primaryAction.label}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset()
        }}
        title={t('editor.dirty.title')}
        description={t('editor.dirty.description')}
        confirmLabel={t('editor.dirty.leave')}
        destructive
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed()
        }}
      />
    </div>
  )
}
