import type { Announcements, Over, ScreenReaderInstructions } from '@dnd-kit/core'

import { t } from '@/lib/i18n'

/*
 * Localized dnd-kit screen-reader feedback (WCAG 4.1.3 Status Messages).
 * dnd-kit ships English-only default announcements; every sortable context in
 * the admin passes these so keyboard / screen-reader users hear pick-up, move,
 * drop and cancel in the active UI locale instead of the built-in English.
 * `item` is the localized noun for the context (widget, card, row, node …).
 */

function position(over: Over | null): string {
  const index = (over?.data?.current?.sortable as { index?: number } | undefined)?.index
  return typeof index === 'number' ? String(index + 1) : ''
}

export function createDndA11y(item: string): {
  announcements: Announcements
  screenReaderInstructions: ScreenReaderInstructions
} {
  return {
    screenReaderInstructions: { draggable: t('dnd.instructions') },
    announcements: {
      onDragStart: () => t('dnd.start', { item }),
      onDragOver: ({ over }) => (over ? t('dnd.over', { item, position: position(over) }) : undefined),
      onDragEnd: ({ over }) =>
        over ? t('dnd.end', { item, position: position(over) }) : t('dnd.end_outside', { item }),
      onDragCancel: () => t('dnd.cancel', { item }),
    },
  }
}
