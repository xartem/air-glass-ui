import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";

import { AppShell } from "@/app/app-shell";
import { ErrorPage, RouteErrorPage } from "@/components/error-page";
import { ReloginDialog } from "@/components/relogin-dialog";
import { GuestLayout } from "@/features/auth/guest-layout";
import { LoginPage } from "@/features/auth/login-page";
import { MfaEnrollGate } from "@/features/auth/mfa-enroll-gate";
import { Spinner } from "@/components/ui/spinner";
import { AuthProvider, GuestOnly, RequirePermission } from "@/lib/auth";

/*
 * [FIX] Route-level code-splitting (was: every screen statically imported →
 * one 1.8MB chunk with TipTap/markdown/charts on the login screen). Rule
 * (E2 §4, cms-admin-ui): feature screens load lazily; only the shell, login,
 * the MFA gate and the placeholder stay eager.
 */
function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(loader);
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
  );
}

const forgotPage = () =>
  lazyPage(() =>
    import("@/features/auth/forgot-page").then((m) => ({
      default: m.ForgotPage,
    })),
  );
const resetPage = () =>
  lazyPage(() =>
    import("@/features/auth/reset-page").then((m) => ({
      default: m.ResetPage,
    })),
  );
const activityPage = () =>
  lazyPage(() =>
    import("@/features/activity/activity-page").then((m) => ({
      default: m.ActivityPage,
    })),
  );
const aiPage = () =>
  lazyPage(() =>
    import("@/features/ai/ai-page").then((m) => ({ default: m.AiPage })),
  );
const aiSettingsPage = () =>
  lazyPage(() =>
    import("@/features/ai/ai-settings-page").then((m) => ({
      default: m.AiSettingsPage,
    })),
  );
const dashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboard/dashboard-page").then((m) => ({
      default: m.DashboardPage,
    })),
  );
const helpPage = () =>
  lazyPage(() =>
    import("@/features/help/help-page").then((m) => ({ default: m.HelpPage })),
  );
const profilePage = () =>
  lazyPage(() =>
    import("@/features/users/profile-page").then((m) => ({
      default: m.ProfilePage,
    })),
  );
const rolesPage = () =>
  lazyPage(() =>
    import("@/features/users/roles-page").then((m) => ({
      default: m.RolesPage,
    })),
  );
const settingsPage = () =>
  lazyPage(() =>
    import("@/features/settings/settings-page").then((m) => ({
      default: m.SettingsPage,
    })),
  );
const appearancePage = () =>
  lazyPage(() =>
    import("@/features/settings/appearance-page").then((m) => ({
      default: m.AppearancePage,
    })),
  );
const uiKitPage = () =>
  lazyPage(() =>
    import("@/features/ui-kit/ui-kit-page").then((m) => ({
      default: m.UiKitPage,
    })),
  );
const userEditorPage = () =>
  lazyPage(() =>
    import("@/features/users/user-editor-page").then((m) => ({
      default: m.UserEditorPage,
    })),
  );
const usersListPage = () =>
  lazyPage(() =>
    import("@/features/users/users-list-page").then((m) => ({
      default: m.UsersListPage,
    })),
  );
const ordersPage = () =>
  lazyPage(() =>
    import("@/features/shop/orders-page").then((m) => ({
      default: m.OrdersPage,
    })),
  );
const orderDetailPage = () =>
  lazyPage(() =>
    import("@/features/shop/order-detail-page").then((m) => ({
      default: m.OrderDetailPage,
    })),
  );
const productsPage = () =>
  lazyPage(() =>
    import("@/features/shop/products-page").then((m) => ({
      default: m.ProductsPage,
    })),
  );
const productEditorPage = () =>
  lazyPage(() =>
    import("@/features/shop/product-editor-page").then((m) => ({
      default: m.ProductEditorPage,
    })),
  );
const customersPage = () =>
  lazyPage(() =>
    import("@/features/shop/customers-page").then((m) => ({
      default: m.CustomersPage,
    })),
  );
const customerDetailPage = () =>
  lazyPage(() =>
    import("@/features/shop/customer-detail-page").then((m) => ({
      default: m.CustomerDetailPage,
    })),
  );
const paymentsPage = () =>
  lazyPage(() =>
    import("@/features/shop/payments-page").then((m) => ({
      default: m.PaymentsPage,
    })),
  );
const invoicesPage = () =>
  lazyPage(() =>
    import("@/features/shop/invoices-page").then((m) => ({
      default: m.InvoicesPage,
    })),
  );
const invoiceDetailPage = () =>
  lazyPage(() =>
    import("@/features/shop/invoice-detail-page").then((m) => ({
      default: m.InvoiceDetailPage,
    })),
  );
const analyticsPage = () =>
  lazyPage(() =>
    import("@/features/analytics/analytics-page").then((m) => ({
      default: m.AnalyticsPage,
    })),
  );
const pricingPage = () =>
  lazyPage(() =>
    import("@/features/pricing/pricing-page").then((m) => ({
      default: m.PricingPage,
    })),
  );
const inboxPage = () =>
  lazyPage(() =>
    import("@/features/inbox/inbox-page").then((m) => ({
      default: m.InboxPage,
    })),
  );
const kanbanPage = () =>
  lazyPage(() =>
    import("@/features/kanban/kanban-page").then((m) => ({
      default: m.KanbanPage,
    })),
  );
const mediaPage = () =>
  lazyPage(() =>
    import("@/features/media/media-page").then((m) => ({
      default: m.MediaPage,
    })),
  );
const discountsPage = () =>
  lazyPage(() =>
    import("@/features/shop/discounts-page").then((m) => ({
      default: m.DiscountsPage,
    })),
  );
const deliveryPage = () =>
  lazyPage(() =>
    import("@/features/shop/delivery-page").then((m) => ({
      default: m.DeliveryPage,
    })),
  );
const statesPage = () =>
  lazyPage(() =>
    import("@/features/showcase/states-page").then((m) => ({
      default: m.StatesPage,
    })),
  );

/*
 * SPA routes (E2 §4). Guest screens live outside the authenticated shell;
 * everything under <AuthedRoot> requires a session (401 on initial load →
 * redirect to /login with return; 401 mid-work → re-login dialog). Every route
 * declares its permission; missing right renders the 403 archetype in place.
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
  );
}


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
        { path: "/login", element: <LoginPage /> },
        { path: "/forgot", element: forgotPage() },
        { path: "/reset/:token", element: resetPage() },
      ],
    },
    {
      element: <AuthedRoot />,
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/", element: dashboardPage() },
        {
          path: "/ai",
          element: (
            <RequirePermission perm="ai.use">{aiPage()}</RequirePermission>
          ),
        },
        // Help: any authenticated user, no permission gate (D:help §6).
        { path: "/help", element: helpPage() },
        { path: "/help/:module/:page", element: helpPage() },
        { path: "/ui-kit", element: uiKitPage() },
        {
          path: "/users",
          element: (
            <RequirePermission perm="users.view">
              {usersListPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/users/new",
          element: (
            <RequirePermission perm="users.manage">
              {userEditorPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/users/:id",
          element: (
            <RequirePermission perm="users.manage">
              {userEditorPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/roles",
          element: (
            <RequirePermission perm="roles.manage">
              {rolesPage()}
            </RequirePermission>
          ),
        },
        // Self-service: any authenticated user (no permission gate).
        { path: "/profile", element: profilePage() },
        {
          path: "/system/activity",
          element: (
            <RequirePermission perm="activity.view">
              {activityPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/system/ai",
          element: (
            <RequirePermission perm="ai.manage">
              {aiSettingsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/settings/:tab?",
          element: (
            <RequirePermission perm="settings.manage">
              {settingsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/appearance",
          element: (
            <RequirePermission perm="settings.manage">
              {appearancePage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/orders",
          element: (
            <RequirePermission perm="orders.view">
              {ordersPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/orders/:id",
          element: (
            <RequirePermission perm="orders.view">
              {orderDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/products",
          element: (
            <RequirePermission perm="products.view">
              {productsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/products/new",
          element: (
            <RequirePermission perm="products.manage">
              {productEditorPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/products/:id",
          element: (
            <RequirePermission perm="products.manage">
              {productEditorPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/customers",
          element: (
            <RequirePermission perm="customers.view">
              {customersPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/customers/:id",
          element: (
            <RequirePermission perm="customers.view">
              {customerDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/payments",
          element: (
            <RequirePermission perm="payments.view">
              {paymentsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/invoices",
          element: (
            <RequirePermission perm="invoices.view">
              {invoicesPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/invoices/:id",
          element: (
            <RequirePermission perm="invoices.view">
              {invoiceDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/analytics",
          element: (
            <RequirePermission perm="analytics.view">
              {analyticsPage()}
            </RequirePermission>
          ),
        },
        // Pricing: presentational demo, any authenticated user (no permission gate).
        { path: "/pricing", element: pricingPage() },
        {
          path: "/inbox",
          element: (
            <RequirePermission perm="inbox.view">
              {inboxPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/kanban",
          element: (
            <RequirePermission perm="kanban.view">
              {kanbanPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/media",
          element: (
            <RequirePermission perm="media.view">
              {mediaPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/discounts",
          element: (
            <RequirePermission perm="orders.discounts">
              {discountsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/delivery",
          element: (
            <RequirePermission perm="orders.delivery">
              {deliveryPage()}
            </RequirePermission>
          ),
        },
        // States showcase: presentational demo, any authenticated user (no gate).
        { path: "/showcase/states", element: statesPage() },
        { path: "*", element: <ErrorPage code="404" /> },
      ],
    },
  ],
  // In dev the SPA is served under the Vite base (/admin-assets/); in production
  // the publisher serves it under /{admin_prefix} and rewrites the base accordingly.
  { basename: import.meta.env.BASE_URL },
);
