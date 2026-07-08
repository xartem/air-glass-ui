/*
 * Global progress store (E1 §2.3): the api client wraps requests with
 * progressStart()/progressDone(); the GlobalProgress bar subscribes here.
 * TanStack Query activity is merged in by the component itself.
 */

let activeCount = 0
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((fn) => fn())
}

export function progressStart(): void {
  activeCount++
  emit()
}

export function progressDone(): void {
  activeCount = Math.max(0, activeCount - 1)
  emit()
}

export function getProgressCount(): number {
  return activeCount
}

export function onProgressChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
