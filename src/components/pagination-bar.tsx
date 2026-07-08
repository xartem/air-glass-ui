import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * PaginationBar (E6 §2): count bottom-LEFT, pages bottom-RIGHT — the single
 * pagination surface for DataTable, media grids and any other paged view.
 * Meta shape matches the Admin API paginator (B7 / Core\Paginator).
 */

export type PaginationMeta = { page: number; pages: number; total: number; perPage: number }

export function PaginationBar({
  pagination,
  shown,
  onPage,
  className,
}: {
  pagination: PaginationMeta
  /** Number of items currently rendered (for the "Showing N of M" counter). */
  shown: number
  onPage?: (page: number) => void
  className?: string
}) {
  const pages = Array.from({ length: pagination.pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 2,
  )

  return (
    <div data-slot="pagination-bar" className={cn('flex items-center justify-between gap-4', className)}>
      <p className="text-sm text-muted-foreground">
        {t('table.shown', { shown, total: pagination.total })}
      </p>
      {pagination.pages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pagination.page <= 1}
            onClick={() => onPage?.(pagination.page - 1)}
            aria-label="‹"
          >
            ‹
          </Button>
          {pages.map((p, index) => (
            <span key={p} className="flex items-center">
              {index > 0 && pages[index - 1] !== p - 1 ? (
                <span className="px-1 text-muted-foreground">…</span>
              ) : null}
              <Button
                variant={p === pagination.page ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => onPage?.(p)}
              >
                {p}
              </Button>
            </span>
          ))}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => onPage?.(pagination.page + 1)}
            aria-label="›"
          >
            ›
          </Button>
        </div>
      ) : null}
    </div>
  )
}
