import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LayoutDashboard, MoreHorizontal, SlidersHorizontal, Zap } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { api, type DashboardAction, type Period } from '@/api'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { EmptyState } from '@/components/empty-state'
import { Panel } from '@/components/panel'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WidgetGrid } from '@/components/widget-grid'
import { useAuth } from '@/lib/auth'
import { dashboardIcon } from '@/lib/dashboard-icons'
import { t } from '@/lib/i18n'
import { useCan } from '@/lib/permissions'
import { useLocale } from '@/lib/use-locale'
import { DashboardCustomize } from './dashboard-customize'
import { DashboardWidgetCard } from './dashboard-widget-card'

/*
 * Dashboard landing (UI:dashboard §2): reachable by ANY authenticated user —
 * there is no dashboard.view permission by design (D:dashboard §9), so the
 * post-login redirect and the 403 screen's home button can never dead-end.
 * Quick actions + a 12-col widget grid; every widget loads independently.
 * ?customize={role_key} deep-links into the per-role customize mode (E2 §6).
 */

/** Client mapping of `api` action slugs to api-client calls (cache.clear today). */
const API_ACTIONS: Record<string, () => Promise<{ ok: true }>> = {
  'cache.clear': api.cache.clear,
}

const INLINE_ACTIONS = 6

export function DashboardPage() {
  useLocale()
  const { me } = useAuth()
  const canManage = useCan('dashboard.manage')
  const [searchParams, setSearchParams] = useSearchParams()
  const customizeParam = searchParams.get('customize')

  const rolesQuery = useQuery({
    queryKey: ['roles'],
    queryFn: api.roles.all,
    staleTime: 30_000,
    enabled: canManage && customizeParam !== null,
  })

  // Without dashboard.manage or with an unknown role key the param is ignored (UI:dashboard §2).
  const customizeRole =
    canManage && customizeParam && rolesQuery.data?.some((role) => role.key === customizeParam)
      ? customizeParam
      : null

  if (canManage && customizeParam && rolesQuery.isPending) {
    return <DashboardSkeleton />
  }

  if (customizeRole) {
    return (
      <DashboardCustomize
        roleKey={customizeRole}
        roles={rolesQuery.data ?? []}
        onSwitchRole={(key) => setSearchParams({ customize: key })}
        onExit={() => {
          const next = new URLSearchParams(searchParams)
          next.delete('customize')
          setSearchParams(next)
        }}
      />
    )
  }

  return <DashboardHome onCustomize={() => setSearchParams({ customize: me.user.role.key })} />
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <WidgetGrid>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36 rounded-xl md:col-span-3 xl:col-span-3" />
        ))}
      </WidgetGrid>
    </div>
  )
}

function DashboardHome({ onCustomize }: { onCustomize: () => void }) {
  const { me } = useAuth()
  const canManage = useCan('dashboard.manage')
  const query = useQuery({ queryKey: ['dashboard'], queryFn: () => api.dashboard.get() })
  // Global period (D:dashboard §4): the window applies uniformly; only period-aware widgets react.
  const [period, setPeriod] = useState<Period>('month')

  const widgets = query.data?.widgets ?? []
  const actions = query.data?.actions ?? []
  const isEmpty = query.isSuccess && widgets.length === 0 && actions.length === 0
  const hasPeriodWidgets = widgets.some((widget) => widget.period_aware)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t('dashboard.greeting', { name: me.user.name.split(' ')[0] })}
          </h1>
          <p className="text-sm text-muted-foreground">{me.user.role.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasPeriodWidgets ? <PeriodTabs period={period} onChange={setPeriod} /> : null}
          {canManage ? (
            <Button variant="outline" onClick={onCustomize}>
              <SlidersHorizontal />
              {t('dashboard.customize')}
            </Button>
          ) : null}
        </div>
      </div>

      {actions.length > 0 ? <QuickActions actions={actions} /> : null}

      {query.isPending ? (
        <WidgetGrid>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl md:col-span-3 xl:col-span-3" />
          ))}
        </WidgetGrid>
      ) : query.isError ? (
        <Panel contentClassName="py-10">
          <EmptyState
            icon={LayoutDashboard}
            title={t('table.error.title')}
            description={t('table.error.description')}
            action={{ label: t('common.retry'), onClick: () => void query.refetch() }}
          />
        </Panel>
      ) : isEmpty ? (
        <Panel contentClassName="py-10">
          <EmptyState icon={LayoutDashboard} title={t('dashboard.empty')} />
        </Panel>
      ) : (
        <WidgetGrid masonry>
          {widgets.map((meta) => (
            <DashboardWidgetCard key={meta.key} meta={meta} period={period} />
          ))}
        </WidgetGrid>
      )}
    </div>
  )
}

/* ---- global period picker (UI:dashboard §2): presets only (week/month/quarter) ---- */

const PERIODS: Period[] = ['week', 'month', 'quarter']

function PeriodTabs({ period, onChange }: { period: Period; onChange: (period: Period) => void }) {
  return (
    <ToggleGroup
      type="single"
      value={period}
      // Radix allows deselect (empty value) — ignore it so a preset is always active.
      onValueChange={(value) => value && onChange(value as Period)}
      variant="outline"
      size="sm"
      aria-label={t('dashboard.period.label')}
    >
      {PERIODS.map((value) => (
        <ToggleGroupItem key={value} value={value}>
          {t(`dashboard.period.${value}`)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/* ---- quick actions row (UI:dashboard §2): first N inline, the rest in a Popover ---- */

function QuickActions({ actions }: { actions: DashboardAction[] }) {
  const [confirmAction, setConfirmAction] = useState<DashboardAction | null>(null)

  const apiMutation = useMutation({
    mutationFn: (action: DashboardAction) => {
      const run = action.api ? API_ACTIONS[action.api] : undefined
      if (!run) return Promise.reject(new Error(`Unknown api action: ${action.api ?? ''}`))
      return run()
    },
    onSuccess: (_result, action) => {
      if (action.key === 'cache.clear') toast.success(t('dashboard.action.cache_cleared'))
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  const run = (action: DashboardAction) => {
    if (action.confirm) setConfirmAction(action)
    else apiMutation.mutate(action)
  }

  const inline = actions.slice(0, INLINE_ACTIONS)
  const overflow = actions.slice(INLINE_ACTIONS)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {inline.map((action) => (
        <QuickActionButton key={action.key} action={action} onRun={run} />
      ))}
      {overflow.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" aria-label={t('dashboard.actions_more')}>
              <MoreHorizontal />
              {t('dashboard.actions_more')}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="flex w-auto flex-col gap-1 p-2">
            {overflow.map((action) => (
              <QuickActionButton key={action.key} action={action} onRun={run} className="justify-start" ghost />
            ))}
          </PopoverContent>
        </Popover>
      ) : null}

      {/* Only cache.clear carries confirm today (UI:dashboard §4). */}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={t('dashboard.action.clear_cache_confirm_title')}
        description={t('dashboard.action.clear_cache_confirm_description')}
        confirmLabel={t('common.confirm')}
        onConfirm={() => {
          if (confirmAction) apiMutation.mutate(confirmAction)
          setConfirmAction(null)
        }}
      />
    </div>
  )
}

function QuickActionButton({
  action,
  onRun,
  className,
  ghost = false,
}: {
  action: DashboardAction
  onRun: (action: DashboardAction) => void
  className?: string
  ghost?: boolean
}) {
  const Icon = dashboardIcon(action.icon) ?? Zap
  const variant = ghost ? 'ghost' : 'outline'
  if (action.route) {
    return (
      <Button variant={variant} asChild className={className}>
        <Link to={action.route}>
          <Icon />
          {t(action.label_key)}
        </Link>
      </Button>
    )
  }
  return (
    <Button variant={variant} className={className} onClick={() => onRun(action)}>
      <Icon />
      {t(action.label_key)}
    </Button>
  )
}
