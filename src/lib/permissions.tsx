import { createContext, useContext, type ReactNode } from 'react'

/*
 * Permissions gating (E2 §8): useCan / <Can> is the ONLY way to check rights in the UI.
 * Real enforcement happens on the server (B7 authorize) — this is UX only.
 * Permissions come from GET /api/me; `null` set means "allow all" (dev / ui-kit).
 */

const PermissionsContext = createContext<ReadonlySet<string> | null>(null)

export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: ReadonlySet<string> | null
  children: ReactNode
}) {
  return <PermissionsContext.Provider value={permissions}>{children}</PermissionsContext.Provider>
}

export function useCan(permission?: string): boolean {
  const permissions = useContext(PermissionsContext)
  if (!permission) return true
  if (permissions === null) return true
  return permissions.has(permission)
}

/**
 * Non-hook checker for filtering lists/maps (rules of hooks forbid useCan there):
 * one context read, then a plain closure usable anywhere in render.
 */
export function usePermissionChecker(): (permission?: string) => boolean {
  const permissions = useContext(PermissionsContext)
  return (permission?: string) =>
    !permission || permissions === null || permissions.has(permission)
}

export function Can({ perm, children }: { perm?: string; children: ReactNode }) {
  const allowed = useCan(perm)
  return allowed ? <>{children}</> : null
}
