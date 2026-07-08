import { TranslationDot, type TranslationState } from '@/components/translation-dots'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * LocaleSwitcher (E2 §7): the ONE global content-locale switch of an editor
 * toolbar. Switching changes which locale every translatable field displays;
 * unsaved edits of other locales stay in the form until the common submit
 * (E4 §1). There is no "Languages" tab — this is the replacement (E6 §1B).
 */

export interface SwitcherLocale {
  code: string
  label: string
  is_default: boolean
  /** Optional per-locale completeness for the indicator dots (C1 §5). */
  state?: TranslationState
}

export function LocaleSwitcher({
  locales,
  value,
  onChange,
  className,
}: {
  locales: SwitcherLocale[]
  value: string
  onChange: (code: string) => void
  className?: string
}) {
  return (
    <div
      data-slot="locale-switcher"
      role="tablist"
      aria-label={t('locale_switcher.label')}
      className={cn('bg-muted/60 inline-flex items-center gap-0.5 rounded-lg p-0.5', className)}
    >
      {locales.map((locale) => {
        const active = locale.code === value
        return (
          <Tooltip key={locale.code}>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(locale.code)}
                className={cn(
                  'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium uppercase transition-colors',
                  active
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {locale.state ? <TranslationDot state={locale.state} /> : null}
                {locale.code}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {locale.label}
              {locale.is_default ? ` · ${t('locale_switcher.default')}` : ''}
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
