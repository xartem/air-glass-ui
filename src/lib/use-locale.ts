import { useSyncExternalStore } from 'react'

import { getLocale, onLocaleChange } from '@/lib/i18n'

/** React binding for the i18n store: re-renders the subscriber on locale change. */
export function useLocale() {
  return useSyncExternalStore(onLocaleChange, getLocale)
}
