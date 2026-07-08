import type { ComponentType } from 'react'
import {
  Activity,
  ChartLine,
  CircleHelp,
  ArrowLeftRight,
  Bot,
  Boxes,
  CircleDollarSign,
  Clock,
  Coins,
  Contact,
  DatabaseBackup,
  FileText,
  Filter,
  FolderTree,
  Gauge,
  HardDriveDownload,
  Image,
  ImagePlus,
  Inbox,
  Languages,
  LayoutDashboard,
  ListTree,
  Mail,
  Megaphone,
  MessageSquareText,
  Newspaper,
  Package,
  PackagePlus,
  Paintbrush,
  Palette,
  Percent,
  Search,
  SearchCheck,
  Send,
  Settings,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  SquarePen,
  SquareStack,
  Truck,
  UserCircle,
  Users,
  Wrench,
} from 'lucide-react'

import type { Me } from '@/api'
import { t } from '@/lib/i18n'

/*
 * The single navigation map (E5 menu tree × E2 §4 route permissions).
 * Consumed by the sidebar AND the ⌘K palette — one source, no drift.
 * Collection entries are dynamic from GET /api/me (E2 §4).
 */

export type NavIcon = ComponentType<{ className?: string }>

export interface NavItem {
  to: string
  label: string
  icon: NavIcon
  perm?: string
}

/** Collapsible second-level node (E5 sub-trees): no route of its own, children carry the links. */
export interface NavParent {
  /** Stable key for open/close persistence (admin.nav_parents). */
  key: string
  label: string
  icon: NavIcon
  children: NavItem[]
}

export type NavEntry = NavItem | NavParent

export function isNavParent(entry: NavEntry): entry is NavParent {
  return 'children' in entry
}

export interface NavGroup {
  key: string
  label: string
  items: NavEntry[]
}

/** Leaf links only (parents are toggles) — for the ⌘K palette and screen-context matching. */
export function flattenNavItems(groups: NavGroup[]): NavItem[] {
  return groups.flatMap((group) =>
    group.items.flatMap((entry) => (isNavParent(entry) ? entry.children : [entry])),
  )
}

export function buildNavGroups(me: Me): NavGroup[] {
  const catalogCollections = me.collections.filter((collection) => collection.kind === 'catalog')
  const channelCollections = me.collections.filter((collection) => collection.kind === 'channel')
  const customCollections = me.collections.filter((collection) => collection.kind === 'custom')

  const collectionItem = (collection: Me['collections'][number]): NavItem => ({
    to: `/c/${collection.slug}`,
    label: collection.label,
    icon: collection.kind === 'catalog' ? Package : Newspaper,
    perm: `collections.${collection.slug}.view`,
  })

  // E5 sub-trees: Catalog and Posts are collapsible parents; parents with no
  // permitted children are dropped by the shell's RBAC filter.
  const catalogParent: NavParent = {
    key: 'catalog',
    label: t('nav.catalog'),
    icon: Package,
    children: [
      ...catalogCollections.map(collectionItem),
      { to: '/c/products/categories', label: t('nav.catalogCategories'), icon: FolderTree, perm: 'catalog.manage' },
      { to: '/catalog/axes', label: t('nav.catalogAxes'), icon: Shapes, perm: 'catalog.manage' },
      { to: '/catalog/filter', label: t('nav.catalogFilter'), icon: Filter, perm: 'catalog.manage' },
      { to: '/catalog/currencies', label: t('nav.currencies'), icon: Coins, perm: 'catalog.manage' },
    ],
  }

  const postsParent: NavParent = {
    key: 'posts',
    label: t('nav.posts'),
    icon: Newspaper,
    children: [
      ...channelCollections.map(collectionItem),
      { to: '/posts/channels', label: t('nav.postChannels'), icon: MessageSquareText, perm: 'posts.manage' },
    ],
  }

  return [
    {
      key: 'main',
      label: t('nav.group.main'),
      items: [{ to: '/', label: t('nav.dashboard'), icon: LayoutDashboard }],
    },
    {
      key: 'content',
      label: t('nav.group.content'),
      items: [
        { to: '/pages', label: t('nav.pages'), icon: FileText, perm: 'pages.view' },
        catalogParent,
        postsParent,
        ...customCollections.map(collectionItem),
        { to: '/blocks', label: t('nav.blocks'), icon: SquareStack, perm: 'pages.manage' },
        { to: '/modals', label: t('nav.modals'), icon: Megaphone, perm: 'pages.modals' },
        { to: '/menus', label: t('nav.menus'), icon: ListTree, perm: 'menus.manage' },
        { to: '/media', label: t('nav.media'), icon: Image, perm: 'media.view' },
        // Constructor last: a monthly tool must not sit amid daily content entries (E5).
        { to: '/collections', label: t('nav.collections'), icon: Boxes, perm: 'collections.fields' },
      ],
    },
    {
      key: 'shop',
      label: t('nav.group.shop'),
      items: [
        { to: '/shop/orders', label: t('nav.orders'), icon: ShoppingCart, perm: 'orders.view' },
        { to: '/shop/products', label: t('nav.products'), icon: Package, perm: 'products.view' },
        { to: '/shop/customers', label: t('nav.customers'), icon: UserCircle, perm: 'customers.view' },
        { to: '/shop/payments', label: t('nav.payments'), icon: CircleDollarSign, perm: 'payments.view' },
        { to: '/shop/delivery', label: t('nav.delivery'), icon: Truck, perm: 'orders.delivery' },
        { to: '/shop/discounts', label: t('nav.discounts'), icon: Percent, perm: 'orders.discounts' },
      ],
    },
    {
      key: 'interaction',
      label: t('nav.group.interaction'),
      items: [
        {
          key: 'forms',
          label: t('nav.forms'),
          icon: Inbox,
          children: [
            { to: '/forms', label: t('nav.forms'), icon: Inbox, perm: 'forms.view' },
            { to: '/forms/submissions', label: t('nav.submissions'), icon: Send, perm: 'forms.submissions' },
          ],
        },
        { to: '/reviews', label: t('nav.reviews'), icon: Star, perm: 'reviews.moderate' },
        { to: '/contacts', label: t('nav.contacts'), icon: Contact, perm: 'contacts.view' },
      ],
    },
    {
      key: 'promotion',
      label: t('nav.group.promotion'),
      items: [
        { to: '/seo', label: t('nav.seo'), icon: SearchCheck, perm: 'seo.manage' },
        { to: '/redirects', label: t('nav.redirects'), icon: ArrowLeftRight, perm: 'redirects.view' },
        { to: '/search', label: t('nav.search'), icon: Search, perm: 'search.manage' },
        { to: '/analytics', label: t('nav.analytics'), icon: ChartLine, perm: 'analytics.view' },
      ],
    },
    {
      key: 'design',
      label: t('nav.group.design'),
      items: [
        { to: '/themes', label: t('nav.themes'), icon: Palette, perm: 'themes.view' },
        { to: '/appearance', label: t('nav.appearance'), icon: Paintbrush, perm: 'settings.manage' },
      ],
    },
    {
      key: 'system',
      label: t('nav.group.system'),
      items: [
        { to: '/settings/site', label: t('nav.settings'), icon: Settings, perm: 'settings.manage' },
        { to: '/i18n', label: t('nav.i18n'), icon: Languages, perm: 'i18n.view' },
        {
          key: 'users',
          label: t('nav.users'),
          icon: Users,
          children: [
            { to: '/users', label: t('nav.users'), icon: Users, perm: 'users.view' },
            { to: '/roles', label: t('nav.roles'), icon: ShieldCheck, perm: 'roles.manage' },
          ],
        },
        { to: '/system/mail', label: t('nav.mail'), icon: Mail, perm: 'mail.view' },
        { to: '/system/channels', label: t('nav.channels'), icon: Send, perm: 'notifications.channels' },
        { to: '/system/modules', label: t('nav.modules'), icon: Wrench, perm: 'modules.manage' },
        {
          key: 'ai',
          label: t('nav.ai'),
          icon: Sparkles,
          children: [
            { to: '/ai', label: t('nav.ai'), icon: Sparkles, perm: 'ai.use' },
            { to: '/system/ai', label: t('nav.aiSettings'), icon: Bot, perm: 'ai.manage' },
          ],
        },
        { to: '/help', label: t('nav.help'), icon: CircleHelp },
        { to: '/ui-kit', label: t('nav.uiKit'), icon: FolderTree },
      ],
    },
    {
      // Operational upkeep split out of System (user decision 2026-07-05, E5).
      key: 'maintenance',
      label: t('nav.group.maintenance'),
      items: [
        { to: '/system/scheduler', label: t('nav.scheduler'), icon: Clock, perm: 'scheduler.view' },
        { to: '/system/cache', label: t('nav.cache'), icon: Gauge, perm: 'cache.view' },
        { to: '/system/backups', label: t('nav.backups'), icon: DatabaseBackup, perm: 'backups.view' },
        { to: '/system/updates', label: t('nav.updates'), icon: HardDriveDownload, perm: 'updates.view' },
        { to: '/system/activity', label: t('nav.activity'), icon: Activity, perm: 'activity.view' },
      ],
    },
  ]
}

/** Quick actions for the ⌘K palette (D:dashboard actions reused as commands). */
export function buildQuickActions(): NavItem[] {
  return [
    { to: '/pages/new', label: t('action.createPage'), icon: SquarePen, perm: 'pages.manage' },
    { to: '/media?upload=1', label: t('action.uploadMedia'), icon: ImagePlus, perm: 'media.manage' },
    { to: '/c/products/new', label: t('action.newProduct'), icon: PackagePlus, perm: 'collections.products.manage' },
    { to: '/c/blog/new', label: t('action.newPost'), icon: SquarePen, perm: 'collections.blog.manage' },
    { to: '/forms/submissions', label: t('action.openSubmissions'), icon: Send, perm: 'forms.submissions' },
  ]
}
