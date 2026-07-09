import { useState } from 'react'
import { Bell, CheckCheck, Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * NotificationsMenu (C8, E5): the topbar bell. Unread dot on the trigger,
 * popover with the latest admin notifications and "mark all read".
 * Items come from GET /api/notifications once the API lands — the shape below
 * mirrors admin_notify() payloads.
 */

export type AdminNotification = {
  id: string
  title: string
  time: string
  read: boolean
}

export function NotificationsMenu({
  initialItems = [],
}: {
  /** Demo/preloaded items; later replaced by a TanStack Query hook. */
  initialItems?: AdminNotification[]
}) {
  const [items, setItems] = useState<AdminNotification[]>(initialItems)
  const unread = items.filter((item) => !item.read).length

  const markAllRead = () => setItems(items.map((item) => ({ ...item, read: true })))
  const markRead = (id: string) =>
    setItems(items.map((item) => (item.id === id ? { ...item, read: true } : item)))

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('shell.notifications')} className="relative">
          <Bell />
          {unread > 0 ? (
            <span className="absolute top-1.5 end-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      {/* Full width on phones (pinned under the header via .mobile-full-popover); 320px from sm up */}
      <PopoverContent align="end" collisionPadding={8} className="mobile-full-popover w-80 p-0">
        <div className="flex items-center justify-between py-1 pe-1 ps-3">
          <p className="text-sm font-medium">{t('notifications.title')}</p>
          {unread > 0 ? (
            <Button variant="ghost" size="sm" onClick={markAllRead}>
              <CheckCheck />
              {t('notifications.markAll')}
            </Button>
          ) : null}
        </div>
        <Separator />
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <Inbox className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
          </div>
        ) : (
          <ul className="max-h-80 overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  aria-label={item.title}
                  className={cn(
                    'flex w-full items-start gap-2.5 px-3 py-2.5 text-start transition-colors hover:bg-muted',
                    !item.read && 'bg-accent/50',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-1.5 size-2 shrink-0 rounded-full',
                      item.read ? 'bg-transparent' : 'bg-primary',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', !item.read && 'font-medium')}>
                      {item.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">{item.time}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
