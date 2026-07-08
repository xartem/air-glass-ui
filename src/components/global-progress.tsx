import { useSyncExternalStore } from 'react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

import { getProgressCount, onProgressChange } from '@/lib/progress'

/*
 * GlobalProgress (E1 §2.3): thin accent-gradient bar at the viewport top,
 * visible while anything loads — TanStack Query fetches/mutations or manual
 * progressStart()/progressDone() from the api client. Mounted once in the shell.
 */

export function GlobalProgress() {
  const manual = useSyncExternalStore(onProgressChange, getProgressCount)
  const fetching = useIsFetching()
  const mutating = useIsMutating()
  const active = manual + fetching + mutating > 0

  return <div className="global-progress" data-active={active ? 'true' : 'false'} aria-hidden />
}
