import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cookie, Plus, Trash2 } from 'lucide-react'

import { api, type SettingValue } from '@/api'
import { LanguageTabs } from '@/components/language-tabs'
import { Panel } from '@/components/panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { t } from '@/lib/i18n'

/*
 * Friendly editors for the two JSON privacy keys (UI:settings §privacy,
 * D:settings §3) — an operator never edits raw JSON. Split into two panels so
 * the layout can place them independently (categories beside the consent form,
 * texts full-width below, E6 §2 width rule). Each is a companion of
 * SettingsGroupForm(privacy): its serialized override rides the tab's SaveBar
 * via `extraChanged` and writes the SAME json key (contract unchanged).
 */

interface ConsentCategory {
  key: string
  required: boolean
}

interface ConsentText {
  title?: string
  description?: string
  accept?: string
  reject?: string
  settings?: string
}

const TEXT_FIELDS: (keyof ConsentText)[] = ['title', 'description', 'accept', 'reject', 'settings']

// Mock: real backend lists the site's active content locales (locale.active, D:i18n) —
// NOT the admin UI locales (LanguageTabs contract). A representative demo set here.
const SITE_LOCALES = ['ru', 'en', 'uk'] as const

function parseCategories(raw: SettingValue): ConsentCategory[] {
  try {
    const parsed = JSON.parse(String(raw ?? '[]'))
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is ConsentCategory => Boolean(item) && typeof item.key === 'string')
      .map((item) => ({ key: item.key, required: Boolean(item.required) }))
  } catch {
    return []
  }
}

function parseTexts(raw: SettingValue): Record<string, ConsentText> {
  try {
    const parsed = JSON.parse(String(raw ?? '{}'))
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ConsentText>) : {}
  } catch {
    return {}
  }
}

/** Drop empty fields/locales so the stored JSON stays compact (empty → shipped fallback). */
function cleanTexts(texts: Record<string, ConsentText>): Record<string, ConsentText> {
  const out: Record<string, ConsentText> = {}
  for (const [locale, value] of Object.entries(texts)) {
    const entry: ConsentText = {}
    for (const field of TEXT_FIELDS) {
      const text = value[field]?.trim()
      if (text) entry[field] = text
    }
    if (Object.keys(entry).length > 0) out[locale] = entry
  }
  return out
}

function usePrivacyValues() {
  const settingsQuery = useQuery({ queryKey: ['settings'], queryFn: api.settings.all, staleTime: 30_000 })
  const privacy = settingsQuery.data?.groups.find((group) => group.group === 'privacy')
  return { privacy, pending: settingsQuery.isPending }
}

/** Categories editor (list of {key, required}); `necessary` is locked. */
export function PrivacyCategories({
  onOverridesChange,
  resetKey,
}: {
  onOverridesChange: (json: string | null) => void
  resetKey: number
}) {
  const { privacy, pending } = usePrivacyValues()
  const initial = useMemo(
    () => parseCategories(privacy?.values['privacy.consent_categories'] ?? null),
    [privacy],
  )
  const [categories, setCategories] = useState<ConsentCategory[]>([])

  useEffect(() => {
    setCategories(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey drives the reload
  }, [resetKey, privacy])

  useEffect(() => {
    const json = JSON.stringify(categories)
    onOverridesChange(json === JSON.stringify(initial) ? null : json)
  }, [categories, initial, onOverridesChange])

  function patch(index: number, next: Partial<ConsentCategory>) {
    setCategories((current) => current.map((item, i) => (i === index ? { ...item, ...next } : item)))
  }

  if (pending) {
    return (
      <Panel icon={Cookie} title={t('privacy.categories.title')} description={t('privacy.categories.hint')}>
        <Skeleton className="h-40 w-full" />
      </Panel>
    )
  }

  return (
    <Panel icon={Cookie} title={t('privacy.categories.title')} description={t('privacy.categories.hint')}>
      <ul className="space-y-2">
        {categories.map((category, index) => {
          const locked = category.key === 'necessary'
          return (
            <li key={index} className="flex items-center gap-3">
              <Input
                value={category.key}
                disabled={locked}
                placeholder={t('privacy.categories.key_placeholder')}
                aria-label={t('privacy.categories.key')}
                onChange={(event) => patch(index, { key: event.target.value })}
                className="max-w-56"
              />
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <Switch
                  checked={category.required}
                  disabled={locked}
                  onCheckedChange={(checked) => patch(index, { required: checked === true })}
                />
                {t('privacy.categories.required')}
              </label>
              {/* `necessary` is mandatory (cookies the site cannot work without) — no remove. */}
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={locked}
                aria-label={t('privacy.categories.remove')}
                className="ms-auto"
                onClick={() => setCategories((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </li>
          )
        })}
      </ul>
      <Button
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => setCategories((current) => [...current, { key: '', required: false }])}
      >
        <Plus />
        {t('privacy.categories.add')}
      </Button>
    </Panel>
  )
}

/** Banner texts per site locale (LanguageTabs); empty fields fall back to shipped strings. */
export function PrivacyTexts({
  onOverridesChange,
  resetKey,
}: {
  onOverridesChange: (json: string | null) => void
  resetKey: number
}) {
  const { privacy, pending } = usePrivacyValues()
  const initial = useMemo(() => parseTexts(privacy?.values['privacy.consent_texts'] ?? null), [privacy])
  const [texts, setTexts] = useState<Record<string, ConsentText>>({})

  useEffect(() => {
    setTexts(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetKey drives the reload
  }, [resetKey, privacy])

  useEffect(() => {
    const json = JSON.stringify(cleanTexts(texts))
    onOverridesChange(json === JSON.stringify(cleanTexts(initial)) ? null : json)
  }, [texts, initial, onOverridesChange])

  function setText(locale: string, field: keyof ConsentText, value: string) {
    setTexts((current) => ({ ...current, [locale]: { ...current[locale], [field]: value } }))
  }

  if (pending) {
    return (
      <Panel icon={Cookie} title={t('privacy.texts.title')} description={t('privacy.texts.hint')}>
        <Skeleton className="h-52 w-full" />
      </Panel>
    )
  }

  return (
    <Panel icon={Cookie} title={t('privacy.texts.title')} description={t('privacy.texts.hint')}>
      <LanguageTabs
        locales={SITE_LOCALES.map((code) => ({
          code,
          state: Object.keys(cleanTexts({ [code]: texts[code] ?? {} })).length > 0 ? 'translated' : 'missing',
        }))}
      >
        {(locale) => (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`consent-title-${locale}`}>{t('privacy.text.banner_title')}</Label>
              <Input
                id={`consent-title-${locale}`}
                value={texts[locale]?.title ?? ''}
                placeholder={t('privacy.text.banner_title_placeholder')}
                onChange={(event) => setText(locale, 'title', event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`consent-desc-${locale}`}>{t('privacy.text.description')}</Label>
              <Textarea
                id={`consent-desc-${locale}`}
                rows={2}
                value={texts[locale]?.description ?? ''}
                placeholder={t('privacy.text.description_placeholder')}
                onChange={(event) => setText(locale, 'description', event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(['accept', 'reject', 'settings'] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`consent-${field}-${locale}`}>{t(`privacy.text.${field}`)}</Label>
                  <Input
                    id={`consent-${field}-${locale}`}
                    value={texts[locale]?.[field] ?? ''}
                    placeholder={t(`privacy.text.${field}_placeholder`)}
                    onChange={(event) => setText(locale, field, event.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </LanguageTabs>
    </Panel>
  )
}
