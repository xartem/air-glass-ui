import type { ComponentType } from "react";
import {
  Activity,
  ChartLine,
  CircleHelp,
  BadgeDollarSign,
  Bot,
  CircleDollarSign,
  Columns3,
  FolderTree,
  Image,
  ImagePlus,
  LayoutDashboard,
  MessageSquareText,
  Package,
  Paintbrush,
  Percent,
  ReceiptText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  UserCircle,
  Users,
} from "lucide-react";

import { t } from "@/lib/i18n";

/*
 * The single navigation map. Consumed by the sidebar AND the ⌘K palette —
 * one source, no drift. Only built, reachable screens are listed here.
 */

export type NavIcon = ComponentType<{ className?: string }>;

export interface NavItem {
  to: string;
  label: string;
  icon: NavIcon;
  perm?: string;
}

/** Collapsible second-level node: no route of its own, children carry the links. */
export interface NavParent {
  /** Stable key for open/close persistence (admin.nav_parents). */
  key: string;
  label: string;
  icon: NavIcon;
  children: NavItem[];
}

export type NavEntry = NavItem | NavParent;

export function isNavParent(entry: NavEntry): entry is NavParent {
  return "children" in entry;
}

export interface NavGroup {
  key: string;
  label: string;
  items: NavEntry[];
}

/** Leaf links only (parents are toggles) — for the ⌘K palette and screen-context matching. */
export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((entry) =>
      isNavParent(entry) ? entry.children : [entry],
    ),
  );
}

export function buildNavGroups(): NavGroup[] {
  return [
    {
      key: "main",
      label: t("nav.group.main"),
      items: [
        { to: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
        {
          to: "/analytics",
          label: t("nav.analytics"),
          icon: ChartLine,
          perm: "analytics.view",
        },
      ],
    },
    {
      key: "content",
      label: t("nav.group.content"),
      items: [
        {
          to: "/media",
          label: t("nav.media"),
          icon: Image,
          perm: "media.view",
        },
      ],
    },
    {
      key: "shop",
      label: t("nav.group.shop"),
      items: [
        {
          to: "/shop/orders",
          label: t("nav.orders"),
          icon: ShoppingCart,
          perm: "orders.view",
        },
        {
          to: "/shop/products",
          label: t("nav.products"),
          icon: Package,
          perm: "products.view",
        },
        {
          to: "/shop/customers",
          label: t("nav.customers"),
          icon: UserCircle,
          perm: "customers.view",
        },
        {
          to: "/shop/payments",
          label: t("nav.payments"),
          icon: CircleDollarSign,
          perm: "payments.view",
        },
        {
          to: "/shop/invoices",
          label: t("nav.invoices"),
          icon: ReceiptText,
          perm: "invoices.view",
        },
        {
          to: "/shop/delivery",
          label: t("nav.delivery"),
          icon: Truck,
          perm: "orders.delivery",
        },
        {
          to: "/shop/discounts",
          label: t("nav.discounts"),
          icon: Percent,
          perm: "orders.discounts",
        },
      ],
    },
    {
      key: "interaction",
      label: t("nav.group.interaction"),
      items: [
        {
          to: "/inbox",
          label: t("nav.inbox"),
          icon: MessageSquareText,
          perm: "inbox.view",
        },
        {
          to: "/kanban",
          label: t("nav.kanban"),
          icon: Columns3,
          perm: "kanban.view",
        },
      ],
    },
    {
      key: "design",
      label: t("nav.group.design"),
      items: [
        {
          to: "/appearance",
          label: t("nav.appearance"),
          icon: Paintbrush,
          perm: "settings.manage",
        },
        // Pricing: a presentational demo screen, reachable by any authenticated user.
        { to: "/pricing", label: t("nav.pricing"), icon: BadgeDollarSign },
      ],
    },
    {
      key: "system",
      label: t("nav.group.system"),
      items: [
        {
          to: "/settings/site",
          label: t("nav.settings"),
          icon: Settings,
          perm: "settings.manage",
        },
        {
          key: "users",
          label: t("nav.users"),
          icon: Users,
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
          key: "ai",
          label: t("nav.ai"),
          icon: Sparkles,
          children: [
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
