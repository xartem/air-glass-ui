import { ApiError, ValidationError } from '../client'
import type {
  MediaPreset,
  MediaPresetOverride,
  SettingSchemaEntry,
  SettingsPayload,
  SettingValue,
} from '../types'

/*
 * Mock of the settings schema + storage (D:settings §6, C7 §3–4).
 * Only the "ownerless" groups live on /settings/{tab}: site, content, media,
 * code, debug. Values persist in localStorage; sensitive values are stored
 * under a shadow key and NEVER returned — the payload carries '***' / ''.
 */

const STORE_KEY = 'mock.settings'
const SENSITIVE_STORE_KEY = 'mock.settings.sensitive'

const SCHEMA: { group: string; entries: SettingSchemaEntry[] }[] = [
  {
    group: 'site',
    entries: [
      { key: 'site_name', type: 'text', default: 'Universal CMS Demo', section: 'main' },
      { key: 'site_url', type: 'url', default: 'https://demo.example.com', has_help: true, section: 'main' },
      { key: 'site_logo', type: 'media', default: null, has_help: true, section: 'images' },
      { key: 'site_logo_dark', type: 'media', default: null, has_help: true, section: 'images' },
      { key: 'site_logo_footer', type: 'media', default: null, has_help: true, section: 'images' },
      { key: 'site_logo_footer_dark', type: 'media', default: null, has_help: true, section: 'images' },
      { key: 'favicon', type: 'media', default: null, section: 'images' },
      { key: 'og_image', type: 'media', default: null, has_help: true, section: 'images' },
      {
        key: 'site.timezone',
        type: 'select',
        options: ['UTC', 'Europe/Kyiv', 'Europe/Warsaw', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Paris'],
        default: 'UTC',
        section: 'datetime',
        span: 'full',
      },
      { key: 'site.date_format', type: 'select', options: ['d.m.Y', 'Y-m-d', 'd/m/Y', 'm/d/Y'], default: 'd.m.Y', section: 'datetime' },
      { key: 'site.time_format', type: 'select', options: ['H:i', 'h:i A'], default: 'H:i', section: 'datetime' },
      {
        key: 'site.maintenance_mode',
        type: 'select',
        options: ['off', 'read_only', 'full'],
        default: 'off',
        has_help: true,
        section: 'mode',
        span: 'full',
      },
    ],
  },
  {
    group: 'content',
    entries: [{ key: 'content.per_page', type: 'number', default: 12, has_help: true }],
  },
  {
    group: 'media',
    entries: [
      { key: 'media.driver', type: 'select', options: ['local', 's3'], default: 'local', has_help: true, span: 'full' },
      // S3 connection (D:media, decision 2026-07-05) — shown only when driver = s3.
      { key: 'media.s3.endpoint', type: 'url', default: '', has_help: true, span: 'full' },
      { key: 'media.s3.region', type: 'text', default: '', span: 'half' },
      { key: 'media.s3.bucket', type: 'text', default: '', span: 'half' },
      { key: 'media.s3.key', type: 'text', sensitive: true, default: '', span: 'half' },
      { key: 'media.s3.secret', type: 'text', sensitive: true, default: '', span: 'half' },
      { key: 'media.s3.public_url', type: 'url', default: '', has_help: true, span: 'full' },
      { key: 'media.image_format', type: 'select', options: ['webp', 'jpeg'], default: 'webp', has_help: true },
      { key: 'media.max_upload_mb', type: 'number', default: 25 },
      { key: 'media.allowed_extensions', type: 'text', default: 'jpg,jpeg,png,webp,svg,gif,pdf', has_help: true },
      { key: 'media.quality', type: 'number', default: 82, has_help: true },
      { key: 'media.max_original_width', type: 'number', default: 2560, has_help: true },
    ],
  },
  {
    group: 'code',
    entries: [
      { key: 'code_head', type: 'code', default: '' },
      { key: 'code_body_open', type: 'code', default: '' },
      { key: 'code_body_close', type: 'code', default: '' },
    ],
  },
  {
    group: 'privacy',
    entries: [
      { key: 'privacy.consent_enabled', type: 'boolean', default: false, has_help: true },
      { key: 'privacy.policy_url', type: 'url', default: '', has_help: true },
      {
        key: 'privacy.consent_categories',
        type: 'json',
        default:
          '[{"key": "necessary", "required": true}, {"key": "analytics", "required": false}, {"key": "marketing", "required": false}]',
        has_help: true,
      },
      { key: 'privacy.consent_texts', type: 'json', default: '{}', has_help: true },
    ],
  },
  {
    group: 'debug',
    entries: [
      { key: 'debug.enabled', type: 'boolean', default: false, has_help: true },
      { key: 'debug.slow_query_ms', type: 'number', default: 150, has_help: true },
      { key: 'debug.sentry_dsn', type: 'text', sensitive: true, default: '', has_help: true },
    ],
  },
  {
    // Module-owned group: renders on /system/ai, not on the /settings tabs
    // (D:settings §6 decision). Keys per D:ai §3; per-provider api_key entries
    // and base_url are filtered by the screen via visibleWhen (UI:ai §4).
    group: 'ai',
    entries: [
      { key: 'ai.provider', type: 'select', options: ['claude', 'openai', 'deepseek', 'gemini', 'openai-compatible'], default: 'claude', section: 'provider', has_help: true },
      { key: 'ai.model', type: 'text', default: 'claude-sonnet-4-5', section: 'provider', span: 'half', has_help: true },
      { key: 'ai.api_key.claude', type: 'text', sensitive: true, default: '', section: 'provider' },
      { key: 'ai.api_key.openai', type: 'text', sensitive: true, default: '', section: 'provider' },
      { key: 'ai.api_key.deepseek', type: 'text', sensitive: true, default: '', section: 'provider' },
      { key: 'ai.api_key.gemini', type: 'text', sensitive: true, default: '', section: 'provider' },
      { key: 'ai.api_key.openai-compatible', type: 'text', sensitive: true, default: '', section: 'provider' },
      { key: 'ai.base_url', type: 'url', default: '', section: 'provider', has_help: true },
      { key: 'ai.daily_cost_cap_minor', type: 'number', default: 500, section: 'limits', has_help: true },
      { key: 'ai.max_output_tokens', type: 'number', default: 4096, section: 'limits', has_help: true },
      { key: 'ai.chat_retention_days', type: 'number', default: 90, section: 'limits', has_help: true },
      { key: 'ai.allowed_categories.read', type: 'boolean', default: true, section: 'categories' },
      { key: 'ai.allowed_categories.write', type: 'boolean', default: true, section: 'categories' },
      { key: 'ai.allowed_categories.destructive', type: 'boolean', default: false, section: 'categories', has_help: true },
      { key: 'ai.mcp_enabled', type: 'boolean', default: false, section: 'mcp', span: 'full', has_help: true },
      { key: 'ai.log_triage_enabled', type: 'boolean', default: false, section: 'triage', has_help: true },
      { key: 'ai.findings_retention_days', type: 'number', default: 90, section: 'triage', has_help: true },
    ],
  },
]

/*
 * Image presets declared by module code / the active theme (D:media §3, C2 §8).
 * The settings screen shows them under SettingsGroupForm(media); operator
 * overrides persist in the `media.preset_sizes` setting as JSON.
 */
export const MEDIA_PRESETS: MediaPreset[] = [
  { key: 'thumbnail', owner: 'media', is_theme: false, format: 'webp', mode: 'cover', width: 320, height: 320, quality: null, retina: true },
  { key: 'admin_preview', owner: 'media', is_theme: false, format: 'webp', mode: 'contain', width: 480, height: 360, quality: null, retina: false },
  { key: 'product_card', owner: 'catalog', is_theme: false, format: 'webp', mode: 'contain', width: 640, height: 480, quality: null, retina: true },
  { key: 'post_cover', owner: 'posts', is_theme: false, format: 'webp', mode: 'cover', width: 1200, height: 630, quality: null, retina: true },
  { key: 'hero', owner: 'aurora', is_theme: true, format: 'webp', mode: 'cover', width: 1920, height: 900, quality: 78, retina: true },
  { key: 'gallery_tile', owner: 'aurora', is_theme: true, format: 'webp', mode: 'crop', width: 800, height: 600, quality: null, retina: true },
]

export function mediaPresetOverrides(): Record<string, MediaPresetOverride> {
  try {
    return JSON.parse(String(readStore(STORE_KEY)['media.preset_sizes'] ?? '{}'))
  } catch {
    return {}
  }
}

function readStore(key: string): Record<string, SettingValue> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

/* Cross-mock reads (mock/ai.ts "Test connection" needs provider + key state). */

export function storedSettingValue(key: string): SettingValue {
  const stored = readStore(STORE_KEY)
  if (key in stored) return stored[key] ?? null
  for (const group of SCHEMA) {
    const entry = group.entries.find((candidate) => candidate.key === key)
    if (entry) return entry.default ?? null
  }
  return null
}

export function sensitiveSettingIsSet(key: string): boolean {
  return Boolean(readStore(SENSITIVE_STORE_KEY)[key])
}

export function buildSettingsPayload(): SettingsPayload {
  const stored = readStore(STORE_KEY)
  const sensitiveStored = readStore(SENSITIVE_STORE_KEY)
  return {
    groups: SCHEMA.map(({ group, entries }) => ({
      group,
      entries,
      values: Object.fromEntries(
        entries.map((entry) => {
          if (entry.sensitive) return [entry.key, sensitiveStored[entry.key] ? '***' : '']
          return [entry.key, stored[entry.key] ?? entry.default ?? null]
        }),
      ),
    })),
  }
}

export function saveSettingsGroup(group: string, changed: Record<string, SettingValue>): { ok: true } {
  const groupSchema = SCHEMA.find((candidate) => candidate.group === group)
  if (!groupSchema) throw new ApiError(404, `Unknown settings group: ${group}`)

  const fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(changed)) {
    // Preset overrides ride in the media batch without a schema entry of their
    // own (changes go to the shared tab SaveBar; storage handled separately).
    if (group === 'media' && key === 'media.preset_sizes') {
      try {
        JSON.parse(String(value ?? '{}'))
      } catch {
        fields[key] = 'invalid_json'
      }
      continue
    }
    const entry = groupSchema.entries.find((candidate) => candidate.key === key)
    if (!entry) throw new ApiError(422, `Unknown settings key: ${key}`)
    if (entry.type === 'url' && value && !/^https?:\/\/[^\s]+\.[^\s]+/.test(String(value))) {
      fields[key] = 'invalid_url'
    }
    if (entry.type === 'number' && value !== null && Number.isNaN(Number(value))) {
      fields[key] = 'invalid_number'
    }
    if (entry.type === 'json' && value !== null && value !== '') {
      try {
        JSON.parse(String(value))
      } catch {
        fields[key] = 'invalid_json'
      }
    }
  }
  if (Object.keys(fields).length > 0) throw new ValidationError('Validation failed', fields)

  const stored = readStore(STORE_KEY)
  const sensitiveStored = readStore(SENSITIVE_STORE_KEY)
  for (const [key, value] of Object.entries(changed)) {
    const entry = groupSchema.entries.find((candidate) => candidate.key === key)
    if (!entry) {
      stored[key] = value // schema-less companion key (media.preset_sizes)
      continue
    }
    if (entry.sensitive) {
      if (value === '***') continue // "keep current" sentinel (D:settings §6)
      if (value === '' || value === null) delete sensitiveStored[key]
      else sensitiveStored[key] = '(encrypted)'
    } else {
      stored[key] = value
    }
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(stored))
  localStorage.setItem(SENSITIVE_STORE_KEY, JSON.stringify(sensitiveStored))

  // site.maintenance_mode feeds the shell banner scenario switch (mock/index.ts)
  if ('site.maintenance_mode' in changed) {
    localStorage.setItem('mock.maintenance', String(changed['site.maintenance_mode']))
  }
  return { ok: true }
}
