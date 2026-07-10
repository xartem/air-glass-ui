import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";

import { AppShell } from "@/app/app-shell";
import { ErrorPage, RouteErrorPage } from "@/components/error-page";
import { ReloginDialog } from "@/components/relogin-dialog";
import { CoverLayout } from "@/features/auth/cover-layout";
import { GuestLayout } from "@/features/auth/guest-layout";
import { PublicLayout } from "@/app/public-layout";
import { StatusLayout } from "@/app/status-layout";
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
const loginCover = () => <LoginPage />;
const signupPage = () =>
  lazyPage(() =>
    import("@/features/auth/signup-page").then((m) => ({
      default: m.SignupPage,
    })),
  );
const passwordCreatePage = () =>
  lazyPage(() =>
    import("@/features/auth/password-create-page").then((m) => ({
      default: m.PasswordCreatePage,
    })),
  );
const verifyPage = () =>
  lazyPage(() =>
    import("@/features/auth/verify-page").then((m) => ({
      default: m.VerifyPage,
    })),
  );
const lockPage = () =>
  lazyPage(() =>
    import("@/features/auth/lock-page").then((m) => ({ default: m.LockPage })),
  );
const logoutPage = () =>
  lazyPage(() =>
    import("@/features/auth/logout-page").then((m) => ({
      default: m.LogoutPage,
    })),
  );
const authSuccessPage = () =>
  lazyPage(() =>
    import("@/features/auth/auth-success-page").then((m) => ({
      default: m.AuthSuccessPage,
    })),
  );
const notFoundPage = () =>
  lazyPage(() =>
    import("@/features/auth/error-pages").then((m) => ({
      default: m.NotFoundPage,
    })),
  );
const notFoundCoverPage = () =>
  lazyPage(() =>
    import("@/features/auth/error-pages").then((m) => ({
      default: m.NotFoundCoverPage,
    })),
  );
const notFoundAltPage = () =>
  lazyPage(() =>
    import("@/features/auth/error-pages").then((m) => ({
      default: m.NotFoundAltPage,
    })),
  );
const serverErrorPage = () =>
  lazyPage(() =>
    import("@/features/auth/error-pages").then((m) => ({
      default: m.ServerErrorPage,
    })),
  );
const offlinePage = () =>
  lazyPage(() =>
    import("@/features/auth/error-pages").then((m) => ({
      default: m.OfflinePage,
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
const productDetailPage = () =>
  lazyPage(() =>
    import("@/features/shop/product-detail-page").then((m) => ({
      default: m.ProductDetailPage,
    })),
  );
const cartPage = () =>
  lazyPage(() =>
    import("@/features/shop/cart-page").then((m) => ({
      default: m.CartPage,
    })),
  );
const checkoutPage = () =>
  lazyPage(() =>
    import("@/features/shop/checkout-page").then((m) => ({
      default: m.CheckoutPage,
    })),
  );
const sellersPage = () =>
  lazyPage(() =>
    import("@/features/shop/sellers-page").then((m) => ({
      default: m.SellersPage,
    })),
  );
const sellerDetailPage = () =>
  lazyPage(() =>
    import("@/features/shop/seller-detail-page").then((m) => ({
      default: m.SellerDetailPage,
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
const createInvoicePage = () =>
  lazyPage(() =>
    import("@/features/shop/create-invoice-page").then((m) => ({
      default: m.CreateInvoicePage,
    })),
  );
const analyticsPage = () =>
  lazyPage(() =>
    import("@/features/analytics/analytics-page").then((m) => ({
      default: m.AnalyticsPage,
    })),
  );
const crmDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/crm-dashboard-page").then((m) => ({
      default: m.CrmDashboardPage,
    })),
  );
const ecommerceDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/ecommerce-dashboard-page").then((m) => ({
      default: m.EcommerceDashboardPage,
    })),
  );
const cryptoDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/crypto-dashboard-page").then((m) => ({
      default: m.CryptoDashboardPage,
    })),
  );
const projectsDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/projects-dashboard-page").then((m) => ({
      default: m.ProjectsDashboardPage,
    })),
  );
const nftDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/nft-dashboard-page").then((m) => ({
      default: m.NftDashboardPage,
    })),
  );
const jobsDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/jobs-dashboard-page").then((m) => ({
      default: m.JobsDashboardPage,
    })),
  );
const blogDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/blog-dashboard-page").then((m) => ({
      default: m.BlogDashboardPage,
    })),
  );
const pricingPage = () =>
  lazyPage(() =>
    import("@/features/pricing/pricing-page").then((m) => ({
      default: m.PricingPage,
    })),
  );
const projectsListPage = () =>
  lazyPage(() =>
    import("@/features/projects/projects-list-page").then((m) => ({
      default: m.ProjectsListPage,
    })),
  );
const projectOverviewPage = () =>
  lazyPage(() =>
    import("@/features/projects/project-overview-page").then((m) => ({
      default: m.ProjectOverviewPage,
    })),
  );
const createProjectPage = () =>
  lazyPage(() =>
    import("@/features/projects/create-project-page").then((m) => ({
      default: m.CreateProjectPage,
    })),
  );
const crmContactsPage = () =>
  lazyPage(() =>
    import("@/features/crm/crm-contacts-page").then((m) => ({
      default: m.CrmContactsPage,
    })),
  );
const crmCompaniesPage = () =>
  lazyPage(() =>
    import("@/features/crm/crm-companies-page").then((m) => ({
      default: m.CrmCompaniesPage,
    })),
  );
const crmDealsPage = () =>
  lazyPage(() =>
    import("@/features/crm/crm-deals-page").then((m) => ({
      default: m.CrmDealsPage,
    })),
  );
const crmLeadsPage = () =>
  lazyPage(() =>
    import("@/features/crm/crm-leads-page").then((m) => ({
      default: m.CrmLeadsPage,
    })),
  );
const taskListPage = () =>
  lazyPage(() =>
    import("@/features/tasks/task-list-page").then((m) => ({
      default: m.TaskListPage,
    })),
  );
const taskDetailPage = () =>
  lazyPage(() =>
    import("@/features/tasks/task-detail-page").then((m) => ({
      default: m.TaskDetailPage,
    })),
  );
const calendarPage = () =>
  lazyPage(() =>
    import("@/features/calendar/calendar-page").then((m) => ({
      default: m.CalendarPage,
    })),
  );
const monthGridPage = () =>
  lazyPage(() =>
    import("@/features/calendar/month-grid-page").then((m) => ({
      default: m.MonthGridPage,
    })),
  );
const inboxPage = () =>
  lazyPage(() =>
    import("@/features/inbox/inbox-page").then((m) => ({
      default: m.InboxPage,
    })),
  );
const mailboxPage = () =>
  lazyPage(() =>
    import("@/features/email/mailbox-page").then((m) => ({
      default: m.MailboxPage,
    })),
  );
const basicTemplatePage = () =>
  lazyPage(() =>
    import("@/features/email/basic-template-page").then((m) => ({
      default: m.BasicTemplatePage,
    })),
  );
const ecommerceTemplatePage = () =>
  lazyPage(() =>
    import("@/features/email/ecommerce-template-page").then((m) => ({
      default: m.EcommerceTemplatePage,
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
const starterPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/starter-page").then((m) => ({
      default: m.StarterPage,
    })),
  );
const sitemapPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/sitemap-page").then((m) => ({
      default: m.SitemapPage,
    })),
  );
const teamPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/team-page").then((m) => ({
      default: m.TeamPage,
    })),
  );
const timelinePage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/timeline-page").then((m) => ({
      default: m.TimelinePage,
    })),
  );
const faqPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/faq-page").then((m) => ({
      default: m.FaqPage,
    })),
  );
const searchResultsPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/search-results-page").then((m) => ({
      default: m.SearchResultsPage,
    })),
  );
const galleryPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/gallery-page").then((m) => ({
      default: m.GalleryPage,
    })),
  );
const maintenancePage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/maintenance-page").then((m) => ({
      default: m.MaintenancePage,
    })),
  );
const comingSoonPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/coming-soon-page").then((m) => ({
      default: m.ComingSoonPage,
    })),
  );
const privacyPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/privacy-page").then((m) => ({
      default: m.PrivacyPage,
    })),
  );
const termsPage = () =>
  lazyPage(() =>
    import("@/features/pages-extra/terms-page").then((m) => ({
      default: m.TermsPage,
    })),
  );
const blogListPage = () =>
  lazyPage(() =>
    import("@/features/blog/blog-list-page").then((m) => ({
      default: m.BlogListPage,
    })),
  );
const blogGridPage = () =>
  lazyPage(() =>
    import("@/features/blog/blog-grid-page").then((m) => ({
      default: m.BlogGridPage,
    })),
  );
const blogOverviewPage = () =>
  lazyPage(() =>
    import("@/features/blog/blog-overview-page").then((m) => ({
      default: m.BlogOverviewPage,
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
        { path: "/signup", element: signupPage() },
        { path: "/password-create", element: passwordCreatePage() },
        { path: "/verify", element: verifyPage() },
      ],
    },
    {
      element: (
        <GuestOnly>
          <CoverLayout />
        </GuestOnly>
      ),
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/login/cover", element: loginCover() },
        { path: "/forgot/cover", element: forgotPage() },
        { path: "/reset/:token/cover", element: resetPage() },
        { path: "/signup/cover", element: signupPage() },
        { path: "/password-create/cover", element: passwordCreatePage() },
        { path: "/verify/cover", element: verifyPage() },
      ],
    },
    {
      element: <PublicLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/404", element: notFoundPage() },
        { path: "/404-cover", element: notFoundCoverPage() },
        { path: "/404-alt", element: notFoundAltPage() },
        { path: "/500", element: serverErrorPage() },
        { path: "/offline", element: offlinePage() },
        { path: "/maintenance", element: maintenancePage() },
        { path: "/coming-soon", element: comingSoonPage() },
        { path: "/privacy", element: privacyPage() },
        { path: "/terms", element: termsPage() },
      ],
    },
    {
      element: <StatusLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/logout", element: logoutPage() },
        { path: "/auth-success", element: authSuccessPage() },
      ],
    },
    {
      element: <CoverLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/logout/cover", element: logoutPage() },
        { path: "/auth-success/cover", element: authSuccessPage() },
      ],
    },
    {
      element: (
        <AuthProvider>
          <StatusLayout />
        </AuthProvider>
      ),
      errorElement: <RouteErrorPage />,
      children: [{ path: "/lock", element: lockPage() }],
    },
    {
      element: (
        <AuthProvider>
          <CoverLayout />
        </AuthProvider>
      ),
      errorElement: <RouteErrorPage />,
      children: [{ path: "/lock/cover", element: lockPage() }],
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
          path: "/shop/products/:id/edit",
          element: (
            <RequirePermission perm="products.manage">
              {productEditorPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/products/:id",
          element: (
            <RequirePermission perm="products.view">
              {productDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/cart",
          element: (
            <RequirePermission perm="orders.view">
              {cartPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/checkout",
          element: (
            <RequirePermission perm="orders.view">
              {checkoutPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/sellers",
          element: (
            <RequirePermission perm="sellers.view">
              {sellersPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/shop/sellers/:id",
          element: (
            <RequirePermission perm="sellers.view">
              {sellerDetailPage()}
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
          path: "/shop/invoices/new",
          element: (
            <RequirePermission perm="invoices.manage">
              {createInvoicePage()}
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
        {
          path: "/dashboards/crm",
          element: (
            <RequirePermission perm="analytics.view">
              {crmDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/ecommerce",
          element: (
            <RequirePermission perm="analytics.view">
              {ecommerceDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/crypto",
          element: (
            <RequirePermission perm="analytics.view">
              {cryptoDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/projects",
          element: (
            <RequirePermission perm="analytics.view">
              {projectsDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/nft",
          element: (
            <RequirePermission perm="analytics.view">
              {nftDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/jobs",
          element: (
            <RequirePermission perm="analytics.view">
              {jobsDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/dashboards/blog",
          element: (
            <RequirePermission perm="analytics.view">
              {blogDashboardPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/projects",
          element: (
            <RequirePermission perm="projects.view">
              {projectsListPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/projects/new",
          element: (
            <RequirePermission perm="projects.manage">
              {createProjectPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/projects/:id",
          element: (
            <RequirePermission perm="projects.view">
              {projectOverviewPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/tasks",
          element: (
            <RequirePermission perm="tasks.view">
              {taskListPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/tasks/:id",
          element: (
            <RequirePermission perm="tasks.view">
              {taskDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crm/contacts",
          element: (
            <RequirePermission perm="contacts.view">
              {crmContactsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crm/companies",
          element: (
            <RequirePermission perm="crm.companies">
              {crmCompaniesPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crm/deals",
          element: (
            <RequirePermission perm="crm.deals">
              {crmDealsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crm/leads",
          element: (
            <RequirePermission perm="crm.leads">
              {crmLeadsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/calendar",
          element: (
            <RequirePermission perm="calendar.view">
              {calendarPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/calendar/month",
          element: (
            <RequirePermission perm="calendar.view">
              {monthGridPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/email",
          element: (
            <RequirePermission perm="email.view">
              {mailboxPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/email/templates/basic",
          element: (
            <RequirePermission perm="email.view">
              {basicTemplatePage()}
            </RequirePermission>
          ),
        },
        {
          path: "/email/templates/ecommerce",
          element: (
            <RequirePermission perm="email.view">
              {ecommerceTemplatePage()}
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
        // W1 utility pages: any authenticated user (no permission gate).
        { path: "/starter", element: starterPage() },
        { path: "/sitemap", element: sitemapPage() },
        { path: "/team", element: teamPage() },
        { path: "/timeline", element: timelinePage() },
        { path: "/faq", element: faqPage() },
        { path: "/search-results", element: searchResultsPage() },
        { path: "/gallery", element: galleryPage() },
        // W1 blog: any authenticated user (no permission gate).
        { path: "/blog/list", element: blogListPage() },
        { path: "/blog/grid", element: blogGridPage() },
        { path: "/blog/:id", element: blogOverviewPage() },
        { path: "*", element: <ErrorPage code="404" /> },
      ],
    },
  ],
  // In dev the SPA is served under the Vite base (/admin-assets/); in production
  // the publisher serves it under /{admin_prefix} and rewrites the base accordingly.
  { basename: import.meta.env.BASE_URL },
);
