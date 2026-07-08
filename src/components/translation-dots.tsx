import { cn } from '@/lib/utils'
import { t } from '@/lib/i18n'

/*
 * TranslationDots (E6 §3, C1 §5): per-locale translation state indicator.
 * translated = green · missing = red · stale = amber. Used in lists and LanguageTabs.
 */

export type TranslationState = 'translated' | 'missing' | 'stale'

const DOT_COLOR: Record<TranslationState, string> = {
  translated: 'var(--status-success-fg)',
  missing: 'var(--status-error-fg)',
  stale: 'var(--status-pending-fg)',
}

export function TranslationDot({
  state,
  className,
}: {
  state: TranslationState
  className?: string
}) {
  return (
    <span
      aria-label={t(`i18n.${state}`)}
      title={t(`i18n.${state}`)}
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: DOT_COLOR[state] }}
    />
  )
}

export function TranslationDots({
  locales,
  className,
}: {
  locales: { code: string; state: TranslationState }[]
  className?: string
}) {
  return (
    <span data-slot="translation-dots" className={cn('inline-flex items-center gap-1.5', className)}>
      {locales.map((locale) => (
        <span
          key={locale.code}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground uppercase"
          title={`${locale.code}: ${t(`i18n.${locale.state}`)}`}
        >
          <TranslationDot state={locale.state} />
          {locale.code}
        </span>
      ))}
    </span>
  )
}
