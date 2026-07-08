import type { ComponentType } from 'react'
import { Ban, Home, RefreshCw, SearchX, ServerCrash } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * ErrorPage (E6 §1F): the single full-page error archetype — 404 (not found),
 * 500 (render/server failure), 403 (no access, E2 §5). Big gradient code,
 * springy icon, primary action right per E6 §2. Screens never build their own
 * error pages.
 */

export type ErrorCode = '404' | '500' | '403'

const ERROR_ICON: Record<ErrorCode, ComponentType<{ className?: string }>> = {
  '404': SearchX,
  '500': ServerCrash,
  '403': Ban,
}

export function ErrorPage({
  code,
  onRetry,
  className,
}: {
  code: ErrorCode
  /** 500 only: retry handler; defaults to a full reload. */
  onRetry?: () => void
  className?: string
}) {
  const navigate = useNavigate()
  const Icon = ERROR_ICON[code]

  return (
    <div
      data-slot="error-page"
      className={cn('flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center', className)}
    >
      <div className="empty-state-icon flex size-16 items-center justify-center rounded-2xl">
        <Icon className="size-7" />
      </div>
      <p
        aria-hidden
        className="bg-[image:var(--gradient-heading)] bg-clip-text text-7xl leading-none font-bold tracking-tight text-transparent"
      >
        {code}
      </p>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">{t(`error.${code}.title`)}</h1>
        <p className="mx-auto max-w-96 text-sm text-muted-foreground">{t(`error.${code}.description`)}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {code === '404' ? (
          <Button variant="outline" onClick={() => navigate(-1)}>
            {t('common.back')}
          </Button>
        ) : null}
        {code === '500' ? (
          <Button onClick={onRetry ?? (() => window.location.reload())}>
            <RefreshCw />
            {t('common.retry')}
          </Button>
        ) : null}
        <Button variant={code === '500' ? 'outline' : 'default'} asChild>
          <Link to="/">
            <Home />
            {t('error.home')}
          </Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Route-level error element (React Router errorElement): a render/loader crash
 * lands here OUTSIDE the shell, so it paints its own mesh backdrop.
 */
export function RouteErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <ErrorPage code="500" />
    </div>
  )
}
