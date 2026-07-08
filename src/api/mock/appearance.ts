import { ValidationError } from '../client'
import type { AppearanceBg, AppearanceSettings, AppearanceStyle } from '../types'

/*
 * Mock of the site-wide appearance config (E1 §2.2.1). Persisted in localStorage;
 * the real backend will store these as public-safe `appearance.*` settings keys.
 */

const STORE_KEY = 'mock.appearance'

const STYLES: AppearanceStyle[] = ['glass', 'liquid', 'flat']
const BGS: AppearanceBg[] = ['air', 'aurora', 'calm', 'plain', 'custom']

export const APPEARANCE_DEFAULTS: AppearanceSettings = {
  style: 'glass',
  bgLight: 'air',
  bgDark: 'air',
  customLight: null,
  customDark: null,
  // glass baseline (matches the locked "Light Air Glass" recipe)
  // accent deepened from #1d8df2 → #176dbd for WCAG AA: it drives --primary at
  // runtime (see lib/appearance.ts), so white button text, links and the accent
  // tint all need ≥4.5:1. Same hue family, kept the "Light Air Glass" look.
  tokens: { blur: 28, radius: 12, saturate: 160, accent: '#176dbd' },
}

function readStore(): AppearanceSettings {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null')
    if (!raw || typeof raw !== 'object') return { ...APPEARANCE_DEFAULTS }
    // Merge over defaults so a partial/older stored shape stays valid.
    const stored = raw as Partial<AppearanceSettings>
    return {
      ...APPEARANCE_DEFAULTS,
      ...stored,
      tokens: { ...APPEARANCE_DEFAULTS.tokens, ...(stored.tokens ?? {}) },
    }
  } catch {
    return { ...APPEARANCE_DEFAULTS }
  }
}

export function getAppearance(): AppearanceSettings {
  return readStore()
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const HEX = /^#[0-9a-fA-F]{6}$/

export function saveAppearance(body: unknown): { ok: true } {
  const input = (body ?? {}) as Partial<AppearanceSettings>
  const fields: Record<string, string> = {}

  if (input.style !== undefined && !STYLES.includes(input.style)) fields.style = 'Unknown style'
  if (input.bgLight !== undefined && !BGS.includes(input.bgLight)) fields.bgLight = 'Unknown background'
  if (input.bgDark !== undefined && !BGS.includes(input.bgDark)) fields.bgDark = 'Unknown background'
  if (input.tokens?.accent !== undefined && !HEX.test(input.tokens.accent)) fields.accent = 'Expected #rrggbb'
  if (input.bgLight === 'custom' && !input.customLight) fields.customLight = 'Pick an image'
  if (input.bgDark === 'custom' && !input.customDark) fields.customDark = 'Pick an image'

  if (Object.keys(fields).length > 0) throw new ValidationError('Validation failed', fields)

  const current = readStore()
  const t: Partial<AppearanceSettings['tokens']> = input.tokens ?? {}
  const next: AppearanceSettings = {
    style: input.style ?? current.style,
    bgLight: input.bgLight ?? current.bgLight,
    bgDark: input.bgDark ?? current.bgDark,
    customLight: input.customLight ?? current.customLight,
    customDark: input.customDark ?? current.customDark,
    tokens: {
      blur: clamp(Math.round(t.blur ?? current.tokens.blur), 0, 48),
      radius: clamp(Math.round(t.radius ?? current.tokens.radius), 6, 24),
      saturate: clamp(Math.round(t.saturate ?? current.tokens.saturate), 100, 220),
      accent: t.accent ?? current.tokens.accent,
    },
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(next))
  return { ok: true }
}
