import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter } from "react-router";

import { AppShell } from "@/app/app-shell";
import { ErrorPage, RouteErrorPage } from "@/components/error-page";
import { ReloginDialog } from "@/components/relogin-dialog";
import { CoverLayout } from "@/features/auth/cover-layout";
import { GuestLayout } from "@/features/auth/guest-layout";
import { PublicLayout } from "@/app/public-layout";
import { StatusLayout } from "@/app/status-layout";
import { LandingLayout } from "@/features/landing/landing-layout";
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
const aiDashboardPage = () =>
  lazyPage(() =>
    import("@/features/dashboards/ai-dashboard-page").then((m) => ({
      default: m.AiDashboardPage,
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
const ticketListPage = () =>
  lazyPage(() =>
    import("@/features/support/ticket-list-page").then((m) => ({
      default: m.TicketListPage,
    })),
  );
const ticketDetailPage = () =>
  lazyPage(() =>
    import("@/features/support/ticket-detail-page").then((m) => ({
      default: m.TicketDetailPage,
    })),
  );
const todoPage = () =>
  lazyPage(() =>
    import("@/features/todo/todo-page").then((m) => ({
      default: m.TodoPage,
    })),
  );
const apiKeysPage = () =>
  lazyPage(() =>
    import("@/features/api-keys/api-keys-page").then((m) => ({
      default: m.ApiKeysPage,
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
const cryptoTransactionsPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-transactions-page").then((m) => ({
      default: m.CryptoTransactionsPage,
    })),
  );
const cryptoBuySellPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-buy-sell-page").then((m) => ({
      default: m.CryptoBuySellPage,
    })),
  );
const cryptoOrdersPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-orders-page").then((m) => ({
      default: m.CryptoOrdersPage,
    })),
  );
const cryptoWalletPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-wallet-page").then((m) => ({
      default: m.CryptoWalletPage,
    })),
  );
const cryptoIcoPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-ico-page").then((m) => ({
      default: m.CryptoIcoPage,
    })),
  );
const cryptoKycPage = () =>
  lazyPage(() =>
    import("@/features/crypto/crypto-kyc-page").then((m) => ({
      default: m.CryptoKycPage,
    })),
  );
const nftMarketplacePage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-marketplace-page").then((m) => ({
      default: m.NftMarketplacePage,
    })),
  );
const nftExplorePage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-explore-page").then((m) => ({
      default: m.NftExplorePage,
    })),
  );
const nftAuctionPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-auction-page").then((m) => ({
      default: m.NftAuctionPage,
    })),
  );
const nftItemDetailPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-item-detail-page").then((m) => ({
      default: m.NftItemDetailPage,
    })),
  );
const nftCollectionsPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-collections-page").then((m) => ({
      default: m.NftCollectionsPage,
    })),
  );
const nftCreatorsPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-creators-page").then((m) => ({
      default: m.NftCreatorsPage,
    })),
  );
const nftRankingPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-ranking-page").then((m) => ({
      default: m.NftRankingPage,
    })),
  );
const nftWalletConnectPage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-wallet-connect-page").then((m) => ({
      default: m.NftWalletConnectPage,
    })),
  );
const nftCreatePage = () =>
  lazyPage(() =>
    import("@/features/nft/nft-create-page").then((m) => ({
      default: m.NftCreatePage,
    })),
  );
const jobsStatisticsPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-statistics-page").then((m) => ({
      default: m.JobsStatisticsPage,
    })),
  );
const jobsListPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-list-page").then((m) => ({
      default: m.JobsListPage,
    })),
  );
const jobsGridPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-grid-page").then((m) => ({
      default: m.JobsGridPage,
    })),
  );
const jobsOverviewPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-overview-page").then((m) => ({
      default: m.JobsOverviewPage,
    })),
  );
const jobsCandidatesPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-candidates-page").then((m) => ({
      default: m.JobsCandidatesPage,
    })),
  );
const jobsCandidatesGridPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-candidates-grid-page").then((m) => ({
      default: m.JobsCandidatesGridPage,
    })),
  );
const jobsApplicationPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-application-page").then((m) => ({
      default: m.JobsApplicationPage,
    })),
  );
const jobsNewPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-new-page").then((m) => ({
      default: m.JobsNewPage,
    })),
  );
const jobsCompaniesPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-companies-page").then((m) => ({
      default: m.JobsCompaniesPage,
    })),
  );
const jobsCategoriesPage = () =>
  lazyPage(() =>
    import("@/features/jobs/jobs-categories-page").then((m) => ({
      default: m.JobsCategoriesPage,
    })),
  );

// W6 — Public landing pages (marketing, no auth; rendered inside LandingLayout).
const oneLandingPage = () =>
  lazyPage(() =>
    import("@/features/landing/one-landing-page").then((m) => ({
      default: m.OneLandingPage,
    })),
  );
const nftLandingPage = () =>
  lazyPage(() =>
    import("@/features/landing/nft-landing-page").then((m) => ({
      default: m.NftLandingPage,
    })),
  );
const jobLandingPage = () =>
  lazyPage(() =>
    import("@/features/landing/job-landing-page").then((m) => ({
      default: m.JobLandingPage,
    })),
  );

// W6 — Layout demos (shell chrome variants; each flips the site-wide layout on mount).
const horizontalLayoutPage = () =>
  lazyPage(() =>
    import("@/features/layouts/layout-demo-page").then((m) => ({
      default: m.HorizontalLayoutPage,
    })),
  );
const detachedLayoutPage = () =>
  lazyPage(() =>
    import("@/features/layouts/layout-demo-page").then((m) => ({
      default: m.DetachedLayoutPage,
    })),
  );
const twoColumnLayoutPage = () =>
  lazyPage(() =>
    import("@/features/layouts/layout-demo-page").then((m) => ({
      default: m.TwoColumnLayoutPage,
    })),
  );
const hoveredLayoutPage = () =>
  lazyPage(() =>
    import("@/features/layouts/layout-demo-page").then((m) => ({
      default: m.HoveredLayoutPage,
    })),
  );

// W5 — Components showcase route table (78 static, authenticated-only pages).
const showcaseRoutes = [
  {
    path: "/components/base/buttons",
    loader: () =>
      import("@/features/ui-kit/base/buttons-page").then((m) => ({
        default: m.ButtonsPage,
      })),
  },
  {
    path: "/components/base/alerts",
    loader: () =>
      import("@/features/ui-kit/base/alerts-page").then((m) => ({
        default: m.AlertsPage,
      })),
  },
  {
    path: "/components/base/badges",
    loader: () =>
      import("@/features/ui-kit/base/badges-page").then((m) => ({
        default: m.BadgesPage,
      })),
  },
  {
    path: "/components/base/colors",
    loader: () =>
      import("@/features/ui-kit/base/colors-page").then((m) => ({
        default: m.ColorsPage,
      })),
  },
  {
    path: "/components/base/cards",
    loader: () =>
      import("@/features/ui-kit/base/cards-page").then((m) => ({
        default: m.CardsPage,
      })),
  },
  {
    path: "/components/base/carousel",
    loader: () =>
      import("@/features/ui-kit/base/carousel-page").then((m) => ({
        default: m.CarouselPage,
      })),
  },
  {
    path: "/components/base/dropdowns",
    loader: () =>
      import("@/features/ui-kit/base/dropdowns-page").then((m) => ({
        default: m.DropdownsPage,
      })),
  },
  {
    path: "/components/base/grid",
    loader: () =>
      import("@/features/ui-kit/base/grid-page").then((m) => ({
        default: m.GridPage,
      })),
  },
  {
    path: "/components/base/images",
    loader: () =>
      import("@/features/ui-kit/base/images-page").then((m) => ({
        default: m.ImagesPage,
      })),
  },
  {
    path: "/components/base/tabs",
    loader: () =>
      import("@/features/ui-kit/base/tabs-page").then((m) => ({
        default: m.TabsPage,
      })),
  },
  {
    path: "/components/base/accordion",
    loader: () =>
      import("@/features/ui-kit/base/accordion-page").then((m) => ({
        default: m.AccordionPage,
      })),
  },
  {
    path: "/components/base/modals",
    loader: () =>
      import("@/features/ui-kit/base/modals-page").then((m) => ({
        default: m.ModalsPage,
      })),
  },
  {
    path: "/components/base/offcanvas",
    loader: () =>
      import("@/features/ui-kit/base/offcanvas-page").then((m) => ({
        default: m.OffcanvasPage,
      })),
  },
  {
    path: "/components/base/placeholders",
    loader: () =>
      import("@/features/ui-kit/base/placeholders-page").then((m) => ({
        default: m.PlaceholdersPage,
      })),
  },
  {
    path: "/components/base/progress",
    loader: () =>
      import("@/features/ui-kit/base/progress-page").then((m) => ({
        default: m.ProgressPage,
      })),
  },
  {
    path: "/components/base/notifications",
    loader: () =>
      import("@/features/ui-kit/base/notifications-page").then((m) => ({
        default: m.NotificationsPage,
      })),
  },
  {
    path: "/components/base/media",
    loader: () =>
      import("@/features/ui-kit/base/media-page").then((m) => ({
        default: m.MediaPage,
      })),
  },
  {
    path: "/components/base/video",
    loader: () =>
      import("@/features/ui-kit/base/video-page").then((m) => ({
        default: m.VideoPage,
      })),
  },
  {
    path: "/components/base/typography",
    loader: () =>
      import("@/features/ui-kit/base/typography-page").then((m) => ({
        default: m.TypographyPage,
      })),
  },
  {
    path: "/components/base/lists",
    loader: () =>
      import("@/features/ui-kit/base/lists-page").then((m) => ({
        default: m.ListsPage,
      })),
  },
  {
    path: "/components/base/links",
    loader: () =>
      import("@/features/ui-kit/base/links-page").then((m) => ({
        default: m.LinksPage,
      })),
  },
  {
    path: "/components/base/general",
    loader: () =>
      import("@/features/ui-kit/base/general-page").then((m) => ({
        default: m.GeneralPage,
      })),
  },
  {
    path: "/components/base/ribbons",
    loader: () =>
      import("@/features/ui-kit/base/ribbons-page").then((m) => ({
        default: m.RibbonsPage,
      })),
  },
  {
    path: "/components/base/utilities",
    loader: () =>
      import("@/features/ui-kit/base/utilities-page").then((m) => ({
        default: m.UtilitiesPage,
      })),
  },
  {
    path: "/components/advance/sweet-alerts",
    loader: () =>
      import("@/features/ui-kit/advance/sweet-alerts-page").then((m) => ({
        default: m.SweetAlertsPage,
      })),
  },
  {
    path: "/components/advance/nestable-list",
    loader: () =>
      import("@/features/ui-kit/advance/nestable-list-page").then((m) => ({
        default: m.NestableListPage,
      })),
  },
  {
    path: "/components/advance/scrollbar",
    loader: () =>
      import("@/features/ui-kit/advance/scrollbar-page").then((m) => ({
        default: m.ScrollbarPage,
      })),
  },
  {
    path: "/components/advance/animation",
    loader: () =>
      import("@/features/ui-kit/advance/animation-page").then((m) => ({
        default: m.AnimationPage,
      })),
  },
  {
    path: "/components/advance/tour",
    loader: () =>
      import("@/features/ui-kit/advance/tour-page").then((m) => ({
        default: m.TourPage,
      })),
  },
  {
    path: "/components/advance/swiper-slider",
    loader: () =>
      import("@/features/ui-kit/advance/swiper-slider-page").then((m) => ({
        default: m.SwiperSliderPage,
      })),
  },
  {
    path: "/components/advance/ratings",
    loader: () =>
      import("@/features/ui-kit/advance/ratings-page").then((m) => ({
        default: m.RatingsPage,
      })),
  },
  {
    path: "/components/advance/highlight",
    loader: () =>
      import("@/features/ui-kit/advance/highlight-page").then((m) => ({
        default: m.HighlightPage,
      })),
  },
  {
    path: "/components/advance/scrollspy",
    loader: () =>
      import("@/features/ui-kit/advance/scrollspy-page").then((m) => ({
        default: m.ScrollSpyPage,
      })),
  },
  {
    path: "/components/forms/basic-elements",
    loader: () =>
      import("@/features/ui-kit/forms/basic-elements-page").then((m) => ({
        default: m.BasicElementsPage,
      })),
  },
  {
    path: "/components/forms/form-select",
    loader: () =>
      import("@/features/ui-kit/forms/form-select-page").then((m) => ({
        default: m.FormSelectPage,
      })),
  },
  {
    path: "/components/forms/checks-radios",
    loader: () =>
      import("@/features/ui-kit/forms/checks-radios-page").then((m) => ({
        default: m.ChecksRadiosPage,
      })),
  },
  {
    path: "/components/forms/pickers",
    loader: () =>
      import("@/features/ui-kit/forms/pickers-page").then((m) => ({
        default: m.PickersPage,
      })),
  },
  {
    path: "/components/forms/input-masks",
    loader: () =>
      import("@/features/ui-kit/forms/input-masks-page").then((m) => ({
        default: m.InputMasksPage,
      })),
  },
  {
    path: "/components/forms/advanced",
    loader: () =>
      import("@/features/ui-kit/forms/advanced-page").then((m) => ({
        default: m.AdvancedPage,
      })),
  },
  {
    path: "/components/forms/range-slider",
    loader: () =>
      import("@/features/ui-kit/forms/range-slider-page").then((m) => ({
        default: m.RangeSliderPage,
      })),
  },
  {
    path: "/components/forms/validation",
    loader: () =>
      import("@/features/ui-kit/forms/validation-page").then((m) => ({
        default: m.ValidationPage,
      })),
  },
  {
    path: "/components/forms/wizard",
    loader: () =>
      import("@/features/ui-kit/forms/wizard-page").then((m) => ({
        default: m.WizardPage,
      })),
  },
  {
    path: "/components/forms/editors",
    loader: () =>
      import("@/features/ui-kit/forms/editors-page").then((m) => ({
        default: m.EditorsPage,
      })),
  },
  {
    path: "/components/forms/file-uploads",
    loader: () =>
      import("@/features/ui-kit/forms/file-uploads-page").then((m) => ({
        default: m.FileUploadsPage,
      })),
  },
  {
    path: "/components/forms/form-layouts",
    loader: () =>
      import("@/features/ui-kit/forms/form-layouts-page").then((m) => ({
        default: m.FormLayoutsPage,
      })),
  },
  {
    path: "/components/forms/select2",
    loader: () =>
      import("@/features/ui-kit/forms/select2-page").then((m) => ({
        default: m.Select2Page,
      })),
  },
  {
    path: "/components/widgets",
    loader: () =>
      import("@/features/ui-kit/widgets-page").then((m) => ({
        default: m.WidgetsPage,
      })),
  },
  {
    path: "/components/tables/basic",
    loader: () =>
      import("@/features/ui-kit/tables/basic-page").then((m) => ({
        default: m.TablesBasicPage,
      })),
  },
  {
    path: "/components/tables/gridjs",
    loader: () =>
      import("@/features/ui-kit/tables/gridjs-page").then((m) => ({
        default: m.TablesGridJsPage,
      })),
  },
  {
    path: "/components/tables/listjs",
    loader: () =>
      import("@/features/ui-kit/tables/listjs-page").then((m) => ({
        default: m.TablesListJsPage,
      })),
  },
  {
    path: "/components/tables/datatables",
    loader: () =>
      import("@/features/ui-kit/tables/datatables-page").then((m) => ({
        default: m.TablesDatatablesPage,
      })),
  },
  {
    path: "/components/charts/line",
    loader: () =>
      import("@/features/ui-kit/charts/line-page").then((m) => ({
        default: m.ChartsLinePage,
      })),
  },
  {
    path: "/components/charts/area",
    loader: () =>
      import("@/features/ui-kit/charts/area-page").then((m) => ({
        default: m.ChartsAreaPage,
      })),
  },
  {
    path: "/components/charts/column",
    loader: () =>
      import("@/features/ui-kit/charts/column-page").then((m) => ({
        default: m.ChartsColumnPage,
      })),
  },
  {
    path: "/components/charts/bar",
    loader: () =>
      import("@/features/ui-kit/charts/bar-page").then((m) => ({
        default: m.ChartsBarPage,
      })),
  },
  {
    path: "/components/charts/mixed",
    loader: () =>
      import("@/features/ui-kit/charts/mixed-page").then((m) => ({
        default: m.ChartsMixedPage,
      })),
  },
  {
    path: "/components/charts/timeline",
    loader: () =>
      import("@/features/ui-kit/charts/timeline-page").then((m) => ({
        default: m.ChartsTimelinePage,
      })),
  },
  {
    path: "/components/charts/range-area",
    loader: () =>
      import("@/features/ui-kit/charts/range-area-page").then((m) => ({
        default: m.ChartsRangeAreaPage,
      })),
  },
  {
    path: "/components/charts/funnel",
    loader: () =>
      import("@/features/ui-kit/charts/funnel-page").then((m) => ({
        default: m.ChartsFunnelPage,
      })),
  },
  {
    path: "/components/charts/candlestick",
    loader: () =>
      import("@/features/ui-kit/charts/candlestick-page").then((m) => ({
        default: m.ChartsCandlestickPage,
      })),
  },
  {
    path: "/components/charts/boxplot",
    loader: () =>
      import("@/features/ui-kit/charts/boxplot-page").then((m) => ({
        default: m.ChartsBoxplotPage,
      })),
  },
  {
    path: "/components/charts/bubble",
    loader: () =>
      import("@/features/ui-kit/charts/bubble-page").then((m) => ({
        default: m.ChartsBubblePage,
      })),
  },
  {
    path: "/components/charts/scatter",
    loader: () =>
      import("@/features/ui-kit/charts/scatter-page").then((m) => ({
        default: m.ChartsScatterPage,
      })),
  },
  {
    path: "/components/charts/heatmap",
    loader: () =>
      import("@/features/ui-kit/charts/heatmap-page").then((m) => ({
        default: m.ChartsHeatmapPage,
      })),
  },
  {
    path: "/components/charts/treemap",
    loader: () =>
      import("@/features/ui-kit/charts/treemap-page").then((m) => ({
        default: m.ChartsTreemapPage,
      })),
  },
  {
    path: "/components/charts/pie",
    loader: () =>
      import("@/features/ui-kit/charts/pie-page").then((m) => ({
        default: m.ChartsPiePage,
      })),
  },
  {
    path: "/components/charts/radialbar",
    loader: () =>
      import("@/features/ui-kit/charts/radialbar-page").then((m) => ({
        default: m.ChartsRadialbarPage,
      })),
  },
  {
    path: "/components/charts/radar",
    loader: () =>
      import("@/features/ui-kit/charts/radar-page").then((m) => ({
        default: m.ChartsRadarPage,
      })),
  },
  {
    path: "/components/charts/polar-area",
    loader: () =>
      import("@/features/ui-kit/charts/polar-area-page").then((m) => ({
        default: m.ChartsPolarAreaPage,
      })),
  },
  {
    path: "/components/charts/slope",
    loader: () =>
      import("@/features/ui-kit/charts/slope-page").then((m) => ({
        default: m.ChartsSlopePage,
      })),
  },
  {
    path: "/components/charts/chartjs",
    loader: () =>
      import("@/features/ui-kit/charts/chartjs-page").then((m) => ({
        default: m.ChartsChartjsPage,
      })),
  },
  {
    path: "/components/charts/echarts",
    loader: () =>
      import("@/features/ui-kit/charts/echarts-page").then((m) => ({
        default: m.ChartsEchartsPage,
      })),
  },
  {
    path: "/components/icons",
    loader: () =>
      import("@/features/ui-kit/icons-page").then((m) => ({
        default: m.IconsPage,
      })),
  },
  {
    path: "/components/maps/base",
    loader: () =>
      import("@/features/ui-kit/maps/base-page").then((m) => ({
        default: m.MapsBasePage,
      })),
  },
  {
    path: "/components/maps/markers",
    loader: () =>
      import("@/features/ui-kit/maps/markers-page").then((m) => ({
        default: m.MapsMarkersPage,
      })),
  },
  {
    path: "/components/maps/substitution",
    loader: () =>
      import("@/features/ui-kit/maps/substitution-page").then((m) => ({
        default: m.MapsSubstitutionPage,
      })),
  },
  {
    path: "/components/multi-level/page-1",
    loader: () =>
      import("@/features/ui-kit/multi-level/level-one-page").then((m) => ({
        default: m.MultiLevelOnePage,
      })),
  },
  {
    path: "/components/multi-level/page-2",
    loader: () =>
      import("@/features/ui-kit/multi-level/level-two-page").then((m) => ({
        default: m.MultiLevelTwoPage,
      })),
  },
].map(({ path, loader }) => ({ path, element: lazyPage(loader) }));

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
      // W6 — Public marketing landing pages: own header/footer, no auth guard.
      element: <LandingLayout />,
      errorElement: <RouteErrorPage />,
      children: [
        { path: "/landing", element: oneLandingPage() },
        { path: "/landing/nft", element: nftLandingPage() },
        { path: "/landing/job", element: jobLandingPage() },
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
        // W6 — Layout demos (any authenticated user, no perm gate). Each route flips the
        // shell layout; they live under AuthedRoot so the app-shell wraps them.
        { path: "/layouts/horizontal", element: horizontalLayoutPage() },
        { path: "/layouts/detached", element: detachedLayoutPage() },
        { path: "/layouts/two-column", element: twoColumnLayoutPage() },
        { path: "/layouts/hovered", element: hoveredLayoutPage() },
        // W5 — Components showcase (any authenticated user, no perm gate).
        ...showcaseRoutes,
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
          path: "/dashboards/ai",
          element: (
            <RequirePermission perm="analytics.view">
              {aiDashboardPage()}
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
        {
          path: "/support/tickets",
          element: (
            <RequirePermission perm="support.view">
              {ticketListPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/support/tickets/:id",
          element: (
            <RequirePermission perm="support.view">
              {ticketDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/todo",
          element: (
            <RequirePermission perm="todo.view">{todoPage()}</RequirePermission>
          ),
        },
        {
          path: "/api-keys",
          element: (
            <RequirePermission perm="apikeys.view">
              {apiKeysPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/transactions",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoTransactionsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/buy-sell",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoBuySellPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/orders",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoOrdersPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/wallet",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoWalletPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/ico",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoIcoPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/crypto/kyc",
          element: (
            <RequirePermission perm="crypto.view">
              {cryptoKycPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/marketplace",
          element: (
            <RequirePermission perm="nft.view">
              {nftMarketplacePage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/explore",
          element: (
            <RequirePermission perm="nft.view">
              {nftExplorePage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/auction",
          element: (
            <RequirePermission perm="nft.view">
              {nftAuctionPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/item/:id",
          element: (
            <RequirePermission perm="nft.view">
              {nftItemDetailPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/collections",
          element: (
            <RequirePermission perm="nft.view">
              {nftCollectionsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/creators",
          element: (
            <RequirePermission perm="nft.view">
              {nftCreatorsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/ranking",
          element: (
            <RequirePermission perm="nft.view">
              {nftRankingPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/wallet-connect",
          element: (
            <RequirePermission perm="nft.view">
              {nftWalletConnectPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/nft/create",
          element: (
            <RequirePermission perm="nft.manage">
              {nftCreatePage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/statistics",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsStatisticsPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/list",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsListPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/grid",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsGridPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/candidates",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsCandidatesPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/candidates/grid",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsCandidatesGridPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/application",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsApplicationPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/new",
          element: (
            <RequirePermission perm="jobs.manage">
              {jobsNewPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/companies",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsCompaniesPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/categories",
          element: (
            <RequirePermission perm="jobs.manage">
              {jobsCategoriesPage()}
            </RequirePermission>
          ),
        },
        {
          path: "/jobs/:id",
          element: (
            <RequirePermission perm="jobs.view">
              {jobsOverviewPage()}
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
