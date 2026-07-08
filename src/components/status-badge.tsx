import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

/*
 * StatusBadge (E6 §3): pill with a dot indicator.
 * Single status color map for ALL modules (E1 §2.2) — do not invent per-screen colors.
 */

export type StatusKind =
  | 'published'
  | 'success'
  | 'draft'
  | 'pending'
  | 'error'
  | 'info'
  | 'archived'

const STATUS_STYLE: Record<StatusKind, { fg: string; bg: string }> = {
  published: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)' },
  success: { fg: 'var(--status-success-fg)', bg: 'var(--status-success-bg)' },
  draft: { fg: 'var(--status-pending-fg)', bg: 'var(--status-pending-bg)' },
  pending: { fg: 'var(--status-pending-fg)', bg: 'var(--status-pending-bg)' },
  error: { fg: 'var(--status-error-fg)', bg: 'var(--status-error-bg)' },
  info: { fg: 'var(--status-info-fg)', bg: 'var(--status-info-bg)' },
  archived: { fg: 'var(--status-neutral-fg)', bg: 'var(--status-neutral-bg)' },
}

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusKind
  /** Custom label; defaults to the translated status name. */
  label?: string
  className?: string
}) {
  const style = STATUS_STYLE[status]
  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        className,
      )}
      style={{ color: style.fg, backgroundColor: style.bg }}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: style.fg }}
      />
      {/* Truncates only when the parent constrains width (e.g. tight widget rows). */}
      <span className="truncate">{label ?? t(`status.${status}`)}</span>
    </span>
  )
}
