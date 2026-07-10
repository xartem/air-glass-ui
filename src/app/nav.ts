import type { ComponentType } from "react";
import {
  Activity,
  Bitcoin,
  Briefcase,
  ChartLine,
  CircleHelp,
  BadgeDollarSign,
  Bot,
  CircleDollarSign,
  Columns3,
  Contact,
  FileStack,
  FileText,
  FolderKanban,
  FolderTree,
  Gem,
  History,
  Image,
  Images,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  LayoutGrid,
  ListTodo,
  MessageSquareText,
  Network,
  Newspaper,
  Package,
  Paintbrush,
  Percent,
  ReceiptText,
  CreditCard,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  UserCircle,
  Users,
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
    // COMPONENTS — placeholder for the W5 UI showcase; app-shell hides empty groups.
    {
      key: "components",
      label: t("nav.group.components"),
      items: [],
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
