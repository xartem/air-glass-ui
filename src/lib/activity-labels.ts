import type { ActivityEntry } from '@/api'
import { t } from '@/lib/i18n'

/*
 * Shared audit-log label helpers (C8 §2): the server stores stable tokens
 * (`action`, `entity_type`); the UI translates them via t('activity.action.*'/
 * 'activity.entity.*') and falls back to the raw token when no key exists.
 * Used by the /system/activity screen and the dashboard `auth.activity` widget.
 */

/** Translate a stable server token; fall back to the raw token when no key exists. */
function labelFor(prefix: string, token: string): string {
  const key = `${prefix}.${token}`
  const label = t(key)
  return label === key ? token : label
}

export const entityLabel = (type: string) => labelFor('activity.entity', type)
export const actionLabel = (action: string) => labelFor('activity.action', action)

/** The entity subject, derived from the server description `"{action}: {title}"`. */
export function entityTitle(entry: ActivityEntry): string {
  const prefix = `${entry.action}: `
  return entry.description.startsWith(prefix)
    ? entry.description.slice(prefix.length)
    : entry.description
}
