import type { ReactNode } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TranslationDot, type TranslationState } from '@/components/translation-dots'

/*
 * LanguageTabs (E6 §3.1, C1 §5): translatable fields render inside these tabs,
 * one tab per active content locale with a translation-state indicator.
 * Saving one locale never wipes the others — the form submits per-locale payloads.
 * Content locales come from the API (locale.active) — they are NOT the admin UI locales.
 */

export function LanguageTabs({
  locales,
  defaultLocale,
  children,
}: {
  locales: { code: string; label?: string; state: TranslationState }[]
  defaultLocale?: string
  children: (localeCode: string) => ReactNode
}) {
  const fallback = defaultLocale ?? locales[0]?.code
  return (
    <Tabs data-slot="language-tabs" defaultValue={fallback}>
      <TabsList>
        {locales.map((locale) => (
          <TabsTrigger key={locale.code} value={locale.code} className="gap-1.5 uppercase">
            <TranslationDot state={locale.state} />
            {locale.label ?? locale.code}
          </TabsTrigger>
        ))}
      </TabsList>
      {locales.map((locale) => (
        <TabsContent key={locale.code} value={locale.code} className="pt-3">
          {children(locale.code)}
        </TabsContent>
      ))}
    </Tabs>
  )
}
