import type { ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  ArrowUpDown,
  Bitcoin,
  Briefcase,
  ChartLine,
  CircleHelp,
  BadgeDollarSign,
  Bot,
  Building2,
  CalendarDays,
  CalendarRange,
  CircleDollarSign,
  Columns2,
  Columns3,
  Compass,
  Contact,
  FilePlus2,
  FileStack,
  FileText,
  FolderKanban,
  FolderTree,
  Gavel,
  Gem,
  History,
  Image,
  Images,
  ImagePlus,
  KeyRound,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Link2,
  ListChecks,
  ListTodo,
  ListTree,
  Mail,
  Map,
  MessageSquareText,
  Network,
  Newspaper,
  Package,
  Paintbrush,
  PanelLeftClose,
  PanelTop,
  Percent,
  ReceiptText,
  CreditCard,
  Rocket,
  ScrollText,
  Settings,
  Shapes,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smile,
  Sparkles,
  Store,
  Table,
  Target,
  TextCursorInput,
  Trophy,
  Truck,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
  Wand2,
  Wrench,
} from "lucide-react";

import { t } from "@/lib/i18n";

/*
 * The single navigation map. Consumed by the sidebar AND the ⌘K palette —
 * one source, no drift. Only built, reachable screens are listed here.
 *
 * Four top sections mirror the Velzon information architecture:
 * MENU (product screens) · PAGES (standalone pages) · COMPONENTS (UI showcase,
 * populated later) · ADMIN (Air Glass configuration & maintenance extras).
 * Parents nest arbitrarily deep (Apps ▸ Ecommerce ▸ Products).
 */

export type NavIcon = ComponentType<{ className?: string }>;

export interface NavItem {
  to: string;
  label: string;
  icon: NavIcon;
  perm?: string;
}

/** Collapsible node: no route of its own. Children may be leaves or further parents. */
export interface NavParent {
  /** Globally unique dotted key for open/close persistence (admin.nav_parents). */
  key: string;
  label: string;
  icon: NavIcon;
  children: Array<NavItem | NavParent>;
}

export type NavEntry = NavItem | NavParent;

export function isNavParent(entry: NavEntry): entry is NavParent {
  return "children" in entry;
}

/** Depth-first leaf collection: parents are toggles, only NavItems carry routes. */
function collectLeaves(entry: NavEntry): NavItem[] {
  return isNavParent(entry) ? entry.children.flatMap(collectLeaves) : [entry];
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavEntry[];
}

/** Leaf links only (parents are toggles) — for the ⌘K palette and screen-context matching. */
export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) => group.items.flatMap(collectLeaves));
}

export function buildNavGroups(): NavGroup[] {
  return [
    {
      key: "menu",
      label: t("nav.group.menu"),
      items: [
        {
          key: "menu.dashboards",
          label: t("nav.dashboards"),
          icon: LayoutDashboard,
          children: [
            { to: "/", label: t("nav.default"), icon: LayoutDashboard },
            {
              to: "/analytics",
              label: t("nav.analytics"),
              icon: ChartLine,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/crm",
              label: t("nav.dashCrm"),
              icon: Contact,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/ecommerce",
              label: t("nav.dashEcommerce"),
              icon: Store,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/crypto",
              label: t("nav.dashCrypto"),
              icon: Bitcoin,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/projects",
              label: t("nav.dashProjects"),
              icon: FolderKanban,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/nft",
              label: t("nav.dashNft"),
              icon: Gem,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/jobs",
              label: t("nav.dashJobs"),
              icon: Briefcase,
              perm: "analytics.view",
            },
            {
              to: "/dashboards/blog",
              label: t("nav.dashBlog"),
              icon: Newspaper,
              perm: "analytics.view",
            },
          ],
        },
        {
          key: "menu.apps",
          label: t("nav.apps"),
          icon: LayoutGrid,
          children: [
            {
              to: "/inbox",
              label: t("nav.chat"),
              icon: MessageSquareText,
              perm: "inbox.view",
            },
            {
              key: "menu.apps.calendar",
              label: t("nav.calendar"),
              icon: CalendarDays,
              children: [
                {
                  to: "/calendar",
                  label: t("nav.calendarMain"),
                  icon: CalendarDays,
                  perm: "calendar.view",
                },
                {
                  to: "/calendar/month",
                  label: t("nav.calendarMonth"),
                  icon: CalendarRange,
                  perm: "calendar.view",
                },
              ],
            },
            {
              key: "menu.apps.email",
              label: t("nav.email"),
              icon: Mail,
              children: [
                {
                  to: "/email",
                  label: t("nav.emailMailbox"),
                  icon: Mail,
                  perm: "email.view",
                },
                {
                  key: "menu.apps.email.templates",
                  label: t("nav.emailTemplates"),
                  icon: Layers,
                  children: [
                    {
                      to: "/email/templates/basic",
                      label: t("nav.emailBasic"),
                      icon: Mail,
                      perm: "email.view",
                    },
                    {
                      to: "/email/templates/ecommerce",
                      label: t("nav.emailEcommerce"),
                      icon: Mail,
                      perm: "email.view",
                    },
                  ],
                },
              ],
            },
            {
              key: "menu.apps.ecommerce",
              label: t("nav.ecommerce"),
              icon: Store,
              children: [
                {
                  to: "/shop/products",
                  label: t("nav.products"),
                  icon: Package,
                  perm: "products.view",
                },
                {
                  to: "/shop/orders",
                  label: t("nav.orders"),
                  icon: ShoppingCart,
                  perm: "orders.view",
                },
                {
                  to: "/shop/cart",
                  label: t("nav.cart"),
                  icon: ShoppingBag,
                  perm: "orders.view",
                },
                {
                  to: "/shop/checkout",
                  label: t("nav.checkout"),
                  icon: CreditCard,
                  perm: "orders.view",
                },
                {
                  to: "/shop/sellers",
                  label: t("nav.sellers"),
                  icon: Store,
                  perm: "sellers.view",
                },
                {
                  to: "/shop/customers",
                  label: t("nav.customers"),
                  icon: UserCircle,
                  perm: "customers.view",
                },
                {
                  to: "/shop/invoices",
                  label: t("nav.invoices"),
                  icon: ReceiptText,
                  perm: "invoices.view",
                },
                {
                  to: "/shop/payments",
                  label: t("nav.payments"),
                  icon: CircleDollarSign,
                  perm: "payments.view",
                },
                {
                  to: "/shop/discounts",
                  label: t("nav.discounts"),
                  icon: Percent,
                  perm: "orders.discounts",
                },
                {
                  to: "/shop/delivery",
                  label: t("nav.delivery"),
                  icon: Truck,
                  perm: "orders.delivery",
                },
              ],
            },
            {
              to: "/projects",
              label: t("nav.projects"),
              icon: FolderKanban,
              perm: "projects.view",
            },
            {
              to: "/tasks",
              label: t("nav.tasks"),
              icon: ListTodo,
              perm: "tasks.view",
            },
            {
              key: "menu.apps.crm",
              label: t("nav.crm"),
              icon: Contact,
              children: [
                {
                  to: "/crm/contacts",
                  label: t("nav.crmContacts"),
                  icon: Contact,
                  perm: "contacts.view",
                },
                {
                  to: "/crm/companies",
                  label: t("nav.crmCompanies"),
                  icon: Building2,
                  perm: "crm.companies",
                },
                {
                  to: "/crm/deals",
                  label: t("nav.crmDeals"),
                  icon: Target,
                  perm: "crm.deals",
                },
                {
                  to: "/crm/leads",
                  label: t("nav.crmLeads"),
                  icon: UserPlus,
                  perm: "crm.leads",
                },
              ],
            },
            {
              key: "menu.apps.crypto",
              label: t("nav.crypto"),
              icon: Bitcoin,
              children: [
                {
                  to: "/crypto/transactions",
                  label: t("nav.cryptoTransactions"),
                  icon: ArrowLeftRight,
                  perm: "crypto.view",
                },
                {
                  to: "/crypto/buy-sell",
                  label: t("nav.cryptoBuySell"),
                  icon: ArrowUpDown,
                  perm: "crypto.view",
                },
                {
                  to: "/crypto/orders",
                  label: t("nav.cryptoOrders"),
                  icon: ScrollText,
                  perm: "crypto.view",
                },
                {
                  to: "/crypto/wallet",
                  label: t("nav.cryptoWallet"),
                  icon: Wallet,
                  perm: "crypto.view",
                },
                {
                  to: "/crypto/ico",
                  label: t("nav.cryptoIco"),
                  icon: Rocket,
                  perm: "crypto.view",
                },
                {
                  to: "/crypto/kyc",
                  label: t("nav.cryptoKyc"),
                  icon: ShieldCheck,
                  perm: "crypto.view",
                },
              ],
            },
            {
              key: "menu.apps.nft",
              label: t("nav.nft"),
              icon: Gem,
              children: [
                {
                  to: "/nft/marketplace",
                  label: t("nav.nftMarketplace"),
                  icon: Store,
                  perm: "nft.view",
                },
                {
                  to: "/nft/explore",
                  label: t("nav.nftExplore"),
                  icon: Compass,
                  perm: "nft.view",
                },
                {
                  to: "/nft/auction",
                  label: t("nav.nftAuction"),
                  icon: Gavel,
                  perm: "nft.view",
                },
                {
                  to: "/nft/collections",
                  label: t("nav.nftCollections"),
                  icon: Layers,
                  perm: "nft.view",
                },
                {
                  to: "/nft/creators",
                  label: t("nav.nftCreators"),
                  icon: Users,
                  perm: "nft.view",
                },
                {
                  to: "/nft/ranking",
                  label: t("nav.nftRanking"),
                  icon: Trophy,
                  perm: "nft.view",
                },
                {
                  to: "/nft/wallet-connect",
                  label: t("nav.nftWalletConnect"),
                  icon: Link2,
                  perm: "nft.view",
                },
                {
                  to: "/nft/create",
                  label: t("nav.nftCreate"),
                  icon: ImagePlus,
                  perm: "nft.manage",
                },
              ],
            },
            {
              key: "menu.apps.jobs",
              label: t("nav.jobs"),
              icon: Briefcase,
              children: [
                {
                  to: "/jobs/statistics",
                  label: t("nav.jobsStatistics"),
                  icon: ChartLine,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/list",
                  label: t("nav.jobsList"),
                  icon: ListChecks,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/grid",
                  label: t("nav.jobsGrid"),
                  icon: LayoutGrid,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/candidates",
                  label: t("nav.jobsCandidates"),
                  icon: Users,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/candidates/grid",
                  label: t("nav.jobsCandidatesGrid"),
                  icon: Contact,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/application",
                  label: t("nav.jobsApplication"),
                  icon: FileText,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/new",
                  label: t("nav.jobsNew"),
                  icon: FilePlus2,
                  perm: "jobs.manage",
                },
                {
                  to: "/jobs/companies",
                  label: t("nav.jobsCompanies"),
                  icon: Building2,
                  perm: "jobs.view",
                },
                {
                  to: "/jobs/categories",
                  label: t("nav.jobsCategories"),
                  icon: FolderTree,
                  perm: "jobs.manage",
                },
              ],
            },
            {
              key: "menu.apps.support",
              label: t("nav.support"),
              icon: LifeBuoy,
              children: [
                {
                  to: "/support/tickets",
                  label: t("nav.supportList"),
                  icon: LifeBuoy,
                  perm: "support.view",
                },
              ],
            },
            {
              to: "/kanban",
              label: t("nav.kanban"),
              icon: Columns3,
              perm: "kanban.view",
            },
            {
              to: "/media",
              label: t("nav.fileManager"),
              icon: Image,
              perm: "media.view",
            },
            {
              to: "/todo",
              label: t("nav.todo"),
              icon: ListChecks,
              perm: "todo.view",
            },
            {
              to: "/api-keys",
              label: t("nav.apiKeys"),
              icon: KeyRound,
              perm: "apikeys.view",
            },
          ],
        },
        // Layouts — shell chrome demos (MENU-SPEC §1.3). No permission gate; each route
        // flips the site-wide layout appearance and every variant shares the single nav map.
        {
          key: "menu.layouts",
          label: t("nav.layouts"),
          icon: LayoutGrid,
          children: [
            {
              to: "/layouts/horizontal",
              label: t("nav.layoutHorizontal"),
              icon: PanelTop,
            },
            {
              to: "/layouts/detached",
              label: t("nav.layoutDetached"),
              icon: Layers,
            },
            {
              to: "/layouts/two-column",
              label: t("nav.layoutTwoColumn"),
              icon: Columns2,
            },
            {
              to: "/layouts/hovered",
              label: t("nav.layoutHovered"),
              icon: PanelLeftClose,
            },
          ],
        },
      ],
    },
    {
      key: "pages",
      label: t("nav.group.pages"),
      items: [
        {
          key: "pages.pages",
          label: t("nav.pages"),
          icon: FileText,
          children: [
            { to: "/profile", label: t("nav.profile"), icon: UserCircle },
            { to: "/pricing", label: t("nav.pricing"), icon: BadgeDollarSign },
          ],
        },
        {
          key: "pages.utility",
          label: t("nav.utility"),
          icon: FileStack,
          children: [
            { to: "/starter", label: t("nav.starter"), icon: FileStack },
            { to: "/team", label: t("nav.team"), icon: Users },
            { to: "/timeline", label: t("nav.timeline"), icon: History },
            { to: "/faq", label: t("nav.faq"), icon: CircleHelp },
            { to: "/gallery", label: t("nav.gallery"), icon: Images },
            { to: "/sitemap", label: t("nav.sitemap"), icon: Network },
          ],
        },
        {
          key: "pages.blog",
          label: t("nav.blog"),
          icon: Newspaper,
          children: [
            { to: "/blog/list", label: t("nav.blogList"), icon: Newspaper },
            { to: "/blog/grid", label: t("nav.blogGrid"), icon: LayoutGrid },
          ],
        },
      ],
    },
    // COMPONENTS — the W5 UI showcase. Parents seed with empty children and are
    // populated by each group task; the app-shell hides parents/groups that have
    // no children yet, so partial waves render cleanly. Widgets and Icons are
    // single-route leaves and are added directly by their group tasks.
    {
      key: "components",
      label: t("nav.group.components"),
      items: [
        {
          key: "components.base",
          label: t("nav.components.base"),
          icon: Shapes,
          children: [
            {
              to: "/components/base/buttons",
              label: t("showcase.base.buttons.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/alerts",
              label: t("showcase.base.alerts.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/badges",
              label: t("showcase.base.badges.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/colors",
              label: t("showcase.base.colors.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/cards",
              label: t("showcase.base.cards.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/carousel",
              label: t("showcase.base.carousel.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/dropdowns",
              label: t("showcase.base.dropdowns.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/grid",
              label: t("showcase.base.grid.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/images",
              label: t("showcase.base.images.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/tabs",
              label: t("showcase.base.tabs.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/accordion",
              label: t("showcase.base.accordion.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/modals",
              label: t("showcase.base.modals.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/offcanvas",
              label: t("showcase.base.offcanvas.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/placeholders",
              label: t("showcase.base.placeholders.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/progress",
              label: t("showcase.base.progress.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/notifications",
              label: t("showcase.base.notifications.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/media",
              label: t("showcase.base.media.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/video",
              label: t("showcase.base.video.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/typography",
              label: t("showcase.base.typography.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/lists",
              label: t("showcase.base.lists.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/links",
              label: t("showcase.base.links.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/general",
              label: t("showcase.base.general.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/ribbons",
              label: t("showcase.base.ribbons.title"),
              icon: Shapes,
            },
            {
              to: "/components/base/utilities",
              label: t("showcase.base.utilities.title"),
              icon: Shapes,
            },
          ],
        },
        {
          key: "components.advance",
          label: t("nav.components.advance"),
          icon: Wand2,
          children: [
            {
              to: "/components/advance/sweet-alerts",
              label: t("showcase.advance.sweetAlerts.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/nestable-list",
              label: t("showcase.advance.nestableList.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/scrollbar",
              label: t("showcase.advance.scrollbar.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/animation",
              label: t("showcase.advance.animation.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/tour",
              label: t("showcase.advance.tour.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/swiper-slider",
              label: t("showcase.advance.swiperSlider.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/ratings",
              label: t("showcase.advance.ratings.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/highlight",
              label: t("showcase.advance.highlight.title"),
              icon: Wand2,
            },
            {
              to: "/components/advance/scrollspy",
              label: t("showcase.advance.scrollspy.title"),
              icon: Wand2,
            },
          ],
        },
        {
          to: "/components/widgets",
          label: t("showcase.widgets.title"),
          icon: LayoutGrid,
        },
        {
          key: "components.forms",
          label: t("nav.components.forms"),
          icon: TextCursorInput,
          children: [
            {
              to: "/components/forms/basic-elements",
              label: t("showcase.forms.basicElements.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/form-select",
              label: t("showcase.forms.formSelect.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/checks-radios",
              label: t("showcase.forms.checksRadios.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/pickers",
              label: t("showcase.forms.pickers.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/input-masks",
              label: t("showcase.forms.inputMasks.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/advanced",
              label: t("showcase.forms.advanced.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/range-slider",
              label: t("showcase.forms.rangeSlider.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/validation",
              label: t("showcase.forms.validation.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/wizard",
              label: t("showcase.forms.wizard.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/editors",
              label: t("showcase.forms.editors.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/file-uploads",
              label: t("showcase.forms.fileUploads.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/form-layouts",
              label: t("showcase.forms.formLayouts.title"),
              icon: TextCursorInput,
            },
            {
              to: "/components/forms/select2",
              label: t("showcase.forms.select2.title"),
              icon: TextCursorInput,
            },
          ],
        },
        {
          key: "components.tables",
          label: t("nav.components.tables"),
          icon: Table,
          children: [
            {
              to: "/components/tables/basic",
              label: t("showcase.tables.basic.title"),
              icon: Table,
            },
            {
              to: "/components/tables/gridjs",
              label: t("showcase.tables.gridjs.title"),
              icon: Table,
            },
            {
              to: "/components/tables/listjs",
              label: t("showcase.tables.listjs.title"),
              icon: Table,
            },
            {
              to: "/components/tables/datatables",
              label: t("showcase.tables.datatables.title"),
              icon: Table,
            },
          ],
        },
        {
          key: "components.charts",
          label: t("nav.components.charts"),
          icon: ChartLine,
          children: [
            {
              to: "/components/charts/line",
              label: t("showcase.charts.line.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/area",
              label: t("showcase.charts.area.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/column",
              label: t("showcase.charts.column.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/bar",
              label: t("showcase.charts.bar.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/mixed",
              label: t("showcase.charts.mixed.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/timeline",
              label: t("showcase.charts.timeline.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/range-area",
              label: t("showcase.charts.rangeArea.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/funnel",
              label: t("showcase.charts.funnel.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/candlestick",
              label: t("showcase.charts.candlestick.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/boxplot",
              label: t("showcase.charts.boxplot.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/bubble",
              label: t("showcase.charts.bubble.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/scatter",
              label: t("showcase.charts.scatter.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/heatmap",
              label: t("showcase.charts.heatmap.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/treemap",
              label: t("showcase.charts.treemap.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/pie",
              label: t("showcase.charts.pie.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/radialbar",
              label: t("showcase.charts.radialbar.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/radar",
              label: t("showcase.charts.radar.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/polar-area",
              label: t("showcase.charts.polarArea.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/slope",
              label: t("showcase.charts.slope.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/chartjs",
              label: t("showcase.charts.chartjs.title"),
              icon: ChartLine,
            },
            {
              to: "/components/charts/echarts",
              label: t("showcase.charts.echarts.title"),
              icon: ChartLine,
            },
          ],
        },
        {
          to: "/components/icons",
          label: t("showcase.icons.title"),
          icon: Smile,
        },
        {
          key: "components.maps",
          label: t("nav.components.maps"),
          icon: Map,
          children: [
            {
              to: "/components/maps/base",
              label: t("showcase.maps.base.title"),
              icon: Map,
            },
            {
              to: "/components/maps/markers",
              label: t("showcase.maps.markers.title"),
              icon: Map,
            },
            {
              to: "/components/maps/substitution",
              label: t("showcase.maps.substitution.title"),
              icon: Map,
            },
          ],
        },
        {
          key: "components.multiLevel",
          label: t("nav.components.multiLevel"),
          icon: ListTree,
          children: [
            {
              key: "components.multiLevel.l1",
              label: t("showcase.multiLevel.level", { level: "1" }),
              icon: ListTree,
              children: [
                {
                  to: "/components/multi-level/page-1",
                  label: t("showcase.multiLevel.one.title"),
                  icon: ListTree,
                },
                {
                  key: "components.multiLevel.l2",
                  label: t("showcase.multiLevel.level", { level: "2" }),
                  icon: ListTree,
                  children: [
                    {
                      to: "/components/multi-level/page-2",
                      label: t("showcase.multiLevel.two.title"),
                      icon: ListTree,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: "admin",
      label: t("nav.group.admin"),
      items: [
        {
          key: "admin.configuration",
          label: t("nav.configuration"),
          icon: Settings,
          children: [
            {
              to: "/settings/site",
              label: t("nav.settings"),
              icon: Settings,
              perm: "settings.manage",
            },
            {
              to: "/appearance",
              label: t("nav.appearance"),
              icon: Paintbrush,
              perm: "settings.manage",
            },
            { to: "/ai", label: t("nav.ai"), icon: Sparkles, perm: "ai.use" },
            {
              to: "/system/ai",
              label: t("nav.aiSettings"),
              icon: Bot,
              perm: "ai.manage",
            },
          ],
        },
        {
          key: "admin.access",
          label: t("nav.access"),
          icon: KeyRound,
          children: [
            {
              to: "/users",
              label: t("nav.users"),
              icon: Users,
              perm: "users.view",
            },
            {
              to: "/roles",
              label: t("nav.roles"),
              icon: ShieldCheck,
              perm: "roles.manage",
            },
          ],
        },
        {
          key: "admin.system",
          label: t("nav.system"),
          icon: Wrench,
          children: [
            {
              to: "/system/activity",
              label: t("nav.activity"),
              icon: Activity,
              perm: "activity.view",
            },
            { to: "/help", label: t("nav.help"), icon: CircleHelp },
            { to: "/ui-kit", label: t("nav.uiKit"), icon: FolderTree },
            { to: "/showcase/states", label: t("nav.states"), icon: Sparkles },
          ],
        },
      ],
    },
  ];
}

/** Quick actions for the ⌘K palette. */
export function buildQuickActions(): NavItem[] {
  return [
    {
      to: "/media?upload=1",
      label: t("action.uploadMedia"),
      icon: ImagePlus,
      perm: "media.manage",
    },
  ];
}
