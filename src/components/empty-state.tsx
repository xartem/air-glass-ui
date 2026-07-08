import type { ComponentType, ReactNode } from 'react'
import { Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/*
 * EmptyState (E6 §3.1): <EmptyState icon title description action? />
 * The single standard "nothing here" view — screens never build their own.
 */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: { label: string; onClick: () => void; icon?: ReactNode }
  className?: string
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}
    >
      <div className="empty-state-icon flex size-14 items-center justify-center rounded-2xl">
        <Icon className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? (
        <Button size="sm" variant="outline" onClick={action.onClick}>
          {action.icon}
          {action.label}
        </Button>
      ) : null}
    </div>
  )
}
