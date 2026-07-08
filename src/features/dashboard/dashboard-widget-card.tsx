import { useQuery } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'

import {
  api,
  type ChartData,
  type DashboardWidgetMeta,
  type ListData,
  type Period,
  type StatData,
  type StatusData,
  type WidgetSize,
  type WidgetType,
} from '@/api'
import {
  CHART_HEIGHT,
  ChartCard,
  LIST_ROWS,
  ListCard,
  StatCard,
  StatusCard,
  WidgetCardFrame,
} from '@/components/widget-cards'
import { WIDGET_SPAN } from '@/components/widget-grid'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'

/*
 * One dashboard widget = one independent request (UI:dashboard §2): its own
 * skeleton/error states, so a slow or failing widget never blocks the screen.
 * No polling by design — refresh happens via refetchOnWindowFocus (Query default).
 */

/** Rigid skeleton (E4 §4/E6): mirrors the final geometry of the archetype at this tier. */
export function WidgetSkeleton({ type, size }: { type: WidgetType; size: WidgetSize }) {
  if (type === 'chart') {
    return <Skeleton className="w-full" style={{ height: CHART_HEIGHT[size] }} />
  }
  if (type === 'stat') {
    const expanded = size === 'lg' || size === 'xl'
    if (size === 'sm') {
      return (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col justify-center space-y-2">
        <div className="flex items-end justify-between gap-2">
          <Skeleton className={expanded ? 'h-12 w-32' : 'h-10 w-28'} />
          <Skeleton className="w-24" style={{ height: expanded ? 44 : 32 }} />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }
  if (type === 'list') {
    if (size === 'sm') {
      return (
        <div className="space-y-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )
    }
    return (
      <div className="space-y-2.5">
        {Array.from({ length: LIST_ROWS[size] }, (_, index) => (
          <Skeleton key={index} className="h-5 w-full" />
        ))}
      </div>
    )
  }
  // status
  return (
    <div className="space-y-2.5">
      {Array.from({ length: size === 'sm' ? 2 : size === 'md' ? 3 : 4 }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function DashboardWidgetCard({ meta, period }: { meta: DashboardWidgetMeta; period: Period }) {
  // Only period-aware widgets key on (and re-query with) the period; state widgets ignore it.
  const query = useQuery({
    queryKey: meta.period_aware ? ['dashboard', 'widget', meta.key, period] : ['dashboard', 'widget', meta.key],
    queryFn: () => api.dashboard.widget(meta.key, meta.period_aware ? period : undefined),
  })

  const title = t(meta.title_key)
  const span = WIDGET_SPAN[meta.size]

  if (query.isPending) {
    return (
      <WidgetCardFrame title={title} href={meta.route} icon={meta.icon} className={span}>
        <WidgetSkeleton type={meta.type} size={meta.size} />
      </WidgetCardFrame>
    )
  }

  if (query.isError) {
    return (
      <WidgetCardFrame title={title} href={meta.route} icon={meta.icon} className={span}>
        <div className="flex flex-col items-start gap-2">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CircleAlert className="size-4 shrink-0 text-destructive" />
            {t('dashboard.widget_error')}
          </p>
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </WidgetCardFrame>
    )
  }

  switch (meta.type) {
    case 'stat':
      return <StatCard title={title} href={meta.route} icon={meta.icon} size={meta.size} data={query.data as StatData} className={span} />
    case 'chart':
      return <ChartCard title={title} href={meta.route} icon={meta.icon} size={meta.size} data={query.data as ChartData} className={span} />
    case 'list':
      return <ListCard title={title} href={meta.route} icon={meta.icon} size={meta.size} data={query.data as ListData} className={span} />
    case 'status':
      return <StatusCard title={title} href={meta.route} icon={meta.icon} size={meta.size} data={query.data as StatusData} className={span} />
  }
}
