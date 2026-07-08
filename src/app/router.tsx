import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'

import { AppShell } from '@/app/app-shell'
import { ErrorPage, RouteErrorPage } from '@/components/error-page'
import { ReloginDialog } from '@/components/relogin-dialog'
import { GuestLayout } from '@/features/auth/guest-layout'
import { LoginPage } from '@/features/auth/login-page'
import { MfaEnrollGate } from '@/features/auth/mfa-enroll-gate'
import { PlaceholderPage } from '@/features/placeholder/placeholder-page'
import { Spinner } from '@/components/ui/spinner'
import { AuthProvider, GuestOnly, RequirePermission } from '@/lib/auth'

/*
 * [FIX] Route-level code-splitting (was: every screen statically imported →
 * one 1.8MB chunk with TipTap/markdown/charts on the login screen). Rule
 * (E2 §4, cms-admin-ui): feature screens load lazily; only the shell, login,
 * the MFA gate and the placeholder stay eager.
 */
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(loader)
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="size-6" />
        </div>
      }
    >
      <Page />
    </Suspense>
  )
}

const forgotPage = () => lazyPage(() => import('@/features/auth/forgot-page').then((m) => ({ default: m.ForgotPage })))
const resetPage = () => lazyPage(() => import('@/features/auth/reset-page').then((m) => ({ default: m.ResetPage })))
const activityPage = () => lazyPage(() => import('@/features/activity/activity-page').then((m) => ({ default: m.ActivityPage })))
const aiPage = () => lazyPage(() => import('@/features/ai/ai-page').then((m) => ({ default: m.AiPage })))
const aiSettingsPage = () => lazyPage(() => import('@/features/ai/ai-settings-page').then((m) => ({ default: m.AiSettingsPage })))
const dashboardPage = () => lazyPage(() => import('@/features/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage })))
const helpPage = () => lazyPage(() => import('@/features/help/help-page').then((m) => ({ default: m.HelpPage })))
const profilePage = () => lazyPage(() => import('@/features/users/profile-page').then((m) => ({ default: m.ProfilePage })))
const rolesPage = () => lazyPage(() => import('@/features/users/roles-page').then((m) => ({ default: m.RolesPage })))
const settingsPage = () => lazyPage(() => import('@/features/settings/settings-page').then((m) => ({ default: m.SettingsPage })))
const appearancePage = () => lazyPage(() => import('@/features/settings/appearance-page').then((m) => ({ default: m.AppearancePage })))
const uiKitPage = () => lazyPage(() => import('@/features/ui-kit/ui-kit-page').then((m) => ({ default: m.UiKitPage })))
const userEditorPage = () => lazyPage(() => import('@/features/users/user-editor-page').then((m) => ({ default: m.UserEditorPage })))
const usersListPage = () => lazyPage(() => import('@/features/users/users-list-page').then((m) => ({ default: m.UsersListPage })))

/*
 * SPA routes (E2 §4). Guest screens live outside the authenticated shell;
 * everything under <AuthedRoot> requires a session (401 on initial load →
 * redirect to /login with return; 401 mid-work → re-login dialog). Every route
 * declares its permission; missing right renders the 403 archetype in place.
 * Screens not yet built render a stage-numbered placeholder
 * (spec/admin/01-build-order.md) so navigation is complete from day one.
 */

function AuthedRoot() {
  return (
    <AuthProvider>
      {/* mfa_required_roles: no shell until 2FA is enrolled (D:auth §6) */}
      <MfaEnrollGate>
        <AppShell />
      </MfaEnrollGate>
      <ReloginDialog />
    </AuthProvider>
  )
}

/** Route map: path × permission × sidebar label key × build-order stage. */
const PLACEHOLDER_ROUTES: { path: string; perm?: string; titleKey: string; stage: number }[] = [
  { path: '/media', perm: 'media.view', titleKey: 'nav.media', stage: 4 },
  { path: '/c/:collection', titleKey: 'nav.collections', stage: 6 },
  { path: '/c/:collection/categories', titleKey: 'nav.collections', stage: 6 },
  { path: '/c/:collection/:id', titleKey: 'nav.collections', stage: 6 },
  { path: '/collections', perm: 'collections.fields', titleKey: 'nav.collections', stage: 6 },
  { path: '/collections/:slug', perm: 'collections.fields', titleKey: 'nav.collections', stage: 6 },
  { path: '/pages', perm: 'pages.view', titleKey: 'nav.pages', stage: 7 },
  { path: '/pages/:id', perm: 'pages.manage', titleKey: 'nav.pages', stage: 7 },
  { path: '/blocks', perm: 'pages.manage', titleKey: 'nav.blocks', stage: 7 },
  { path: '/modals', perm: 'pages.modals', titleKey: 'nav.modals', stage: 7 },
  { path: '/menus', perm: 'menus.manage', titleKey: 'nav.menus', stage: 8 },
  { path: '/forms', perm: 'forms.view', titleKey: 'nav.forms', stage: 10 },
  { path: '/forms/submissions', perm: 'forms.submissions', titleKey: 'nav.submissions', stage: 10 },
  { path: '/forms/:id', perm: 'forms.manage', titleKey: 'nav.forms', stage: 10 },
  { path: '/contacts', perm: 'contacts.view', titleKey: 'nav.contacts', stage: 10 },
  { path: '/reviews', perm: 'reviews.moderate', titleKey: 'nav.reviews', stage: 10 },
  { path: '/posts/channels', perm: 'posts.manage', titleKey: 'nav.postChannels', stage: 11 },
  { path: '/catalog/axes', perm: 'catalog.manage', titleKey: 'nav.catalogAxes', stage: 11 },
  { path: '/catalog/filter', perm: 'catalog.manage', titleKey: 'nav.catalogFilter', stage: 11 },
  { path: '/catalog/currencies', perm: 'catalog.manage', titleKey: 'nav.currencies', stage: 11 },
  { path: '/catalog/records/:id/variants', perm: 'catalog.manage', titleKey: 'nav.catalogAxes', stage: 11 },
  { path: '/system/mail', perm: 'mail.view', titleKey: 'nav.mail', stage: 12 },
  { path: '/system/channels', perm: 'notifications.channels', titleKey: 'nav.channels', stage: 12 },
  { path: '/notifications', titleKey: 'nav.notifications', stage: 12 },
  { path: '/i18n', perm: 'i18n.view', titleKey: 'nav.i18n', stage: 13 },
  { path: '/themes', perm: 'themes.view', titleKey: 'nav.themes', stage: 14 },
  { path: '/themes/:slug/customize', perm: 'themes.manage', titleKey: 'nav.themes', stage: 14 },
  { path: '/system/scheduler', perm: 'scheduler.view', titleKey: 'nav.scheduler', stage: 15 },
  { path: '/system/cache', perm: 'cache.view', titleKey: 'nav.cache', stage: 15 },
  { path: '/system/backups', perm: 'backups.view', titleKey: 'nav.backups', stage: 15 },
  { path: '/system/updates', perm: 'updates.view', titleKey: 'nav.updates', stage: 15 },
  { path: '/system/modules', perm: 'modules.manage', titleKey: 'nav.modules', stage: 15 },
  { path: '/shop/orders', perm: 'orders.view', titleKey: 'nav.orders', stage: 16 },
  { path: '/shop/orders/:id', perm: 'orders.view', titleKey: 'nav.orders', stage: 16 },
  { path: '/shop/customers', perm: 'customers.view', titleKey: 'nav.customers', stage: 16 },
  { path: '/shop/customers/:id', perm: 'customers.view', titleKey: 'nav.customers', stage: 16 },
  { path: '/shop/payments', perm: 'payments.view', titleKey: 'nav.payments', stage: 16 },
  { path: '/shop/delivery', perm: 'orders.delivery', titleKey: 'nav.delivery', stage: 16 },
  { path: '/shop/discounts', perm: 'orders.discounts', titleKey: 'nav.discounts', stage: 16 },
  { path: '/seo', perm: 'seo.manage', titleKey: 'nav.seo', stage: 17 },
  { path: '/redirects', perm: 'redirects.view', titleKey: 'nav.redirects', stage: 17 },
  { path: '/search', perm: 'search.manage', titleKey: 'nav.search', stage: 17 },
  { path: '/analytics', perm: 'analytics.view', titleKey: 'nav.analytics', stage: 17 },
]

export const router = createBrowserRouter(
  [
  {
    element: (
      <GuestOnly>
        <GuestLayout />
      </GuestOnly>
    ),
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/forgot', element: forgotPage() },
      { path: '/reset/:token', element: resetPage() },
    ],
  },
  {
    element: <AuthedRoot />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: dashboardPage() },
      {
        path: '/ai',
        element: (
          <RequirePermission perm="ai.use">
            {aiPage()}
          </RequirePermission>
        ),
      },
      // Help: any authenticated user, no permission gate (D:help §6).
      { path: '/help', element: helpPage() },
      { path: '/help/:module/:page', element: helpPage() },
      { path: '/ui-kit', element: uiKitPage() },
      {
        path: '/users',
        element: (
          <RequirePermission perm="users.view">
            {usersListPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/users/new',
        element: (
          <RequirePermission perm="users.manage">
            {userEditorPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/users/:id',
        element: (
          <RequirePermission perm="users.manage">
            {userEditorPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/roles',
        element: (
          <RequirePermission perm="roles.manage">
            {rolesPage()}
          </RequirePermission>
        ),
      },
      // Self-service: any authenticated user (no permission gate).
      { path: '/profile', element: profilePage() },
      {
        path: '/system/activity',
        element: (
          <RequirePermission perm="activity.view">
            {activityPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/system/ai',
        element: (
          <RequirePermission perm="ai.manage">
            {aiSettingsPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/settings/:tab?',
        element: (
          <RequirePermission perm="settings.manage">
            {settingsPage()}
          </RequirePermission>
        ),
      },
      {
        path: '/appearance',
        element: (
          <RequirePermission perm="settings.manage">
            {appearancePage()}
          </RequirePermission>
        ),
      },
      ...PLACEHOLDER_ROUTES.map((route) => ({
        path: route.path,
        element: (
          <RequirePermission perm={route.perm}>
            <PlaceholderPage titleKey={route.titleKey} stage={route.stage} />
          </RequirePermission>
        ),
      })),
      { path: '*', element: <ErrorPage code="404" /> },
      ],
    },
  ],
  // In dev the SPA is served under the Vite base (/admin-assets/); in production
  // the publisher serves it under /{admin_prefix} and rewrites the base accordingly.
  { basename: import.meta.env.BASE_URL },
)
