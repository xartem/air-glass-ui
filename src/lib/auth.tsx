import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router'

import { api, ApiError, type Me } from '@/api'
import { ErrorPage } from '@/components/error-page'
import { Spinner } from '@/components/ui/spinner'
import { useLocale } from '@/lib/use-locale'
import { PermissionsProvider, useCan } from '@/lib/permissions'
import { spaUrl } from '@/lib/utils'

/*
 * Session context (E2 §5): GET /api/me on SPA start feeds user, permissions,
 * content locales and collections. 401 on initial load → redirect to /login
 * (with return path); 401 mid-work is handled by the re-login dialog instead
 * (see api/client.ts + components/relogin-dialog.tsx) — never a redirect.
 */

interface AuthContextValue {
  me: Me
  refresh: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  // /me carries content-localized labels (collections, C1); refetch on UI-locale
  // switch so the sidebar stays in sync with chrome. keepPreviousData avoids a
  // full-screen spinner flash while the re-localized payload loads.
  const locale = useLocale()

  const meQuery = useQuery({
    queryKey: ['me', locale],
    queryFn: api.me,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status === 401) && failureCount < 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

  const value = useMemo<AuthContextValue | null>(() => {
    if (!meQuery.data) return null
    return {
      me: meQuery.data,
      refresh: async () => {
        await queryClient.invalidateQueries({ queryKey: ['me'] })
      },
      logout: async () => {
        await api.auth.logout()
        queryClient.clear()
        // [FIX] bare '/login' escaped the SPA basename (/{admin_prefix} in prod).
        if (import.meta.env.DEV) console.debug('[FIX] logout redirect', spaUrl('/login'))
        window.location.assign(spaUrl('/login'))
      },
    }
  }, [meQuery.data, queryClient])

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!value) {
    const returnTo = location.pathname + location.search
    const query = returnTo !== '/' ? `?return=${encodeURIComponent(returnTo)}` : ''
    return <Navigate to={`/login${query}`} replace />
  }

  return (
    <AuthContext.Provider value={value}>
      <PermissionsProvider permissions={new Set(value.me.permissions)}>{children}</PermissionsProvider>
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Content locales from /api/me (C1) — for LocaleSwitcher and editors. */
export function useContentLocales() {
  return useAuth().me.locales
}

/** Route-level permission gate: renders the 403 archetype instead of the screen. */
export function RequirePermission({ perm, children }: { perm?: string; children: ReactNode }) {
  const allowed = useCan(perm)
  return allowed ? <>{children}</> : <ErrorPage code="403" />
}

/** Guest-only routes (/login, /forgot, /reset): authenticated users go home. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: api.me,
    retry: false,
    staleTime: 60_000,
  })
  if (meQuery.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }
  return meQuery.data ? <Navigate to="/" replace /> : <>{children}</>
}
