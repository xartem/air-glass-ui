import type { ComponentType } from 'react'
import {
  Activity,
  BellRing,
  Briefcase,
  CalendarClock,
  ChartColumn,
  ChartLine,
  DatabaseBackup,
  FileText,
  Folder,
  Gauge,
  HardDrive,
  ImagePlus,
  Inbox,
  Languages,
  Layers,
  Mail,
  MessageSquare,
  Newspaper,
  Package,
  PackagePlus,
  RefreshCw,
  Search,
  SearchCheck,
  Send,
  ShoppingCart,
  Sparkles,
  SquarePen,
  Star,
  Timer,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'

/*
 * Server sends icon slugs (D:dashboard §4: registerWidget/registerAction meta);
 * the SPA maps them to lucide here. An EXPLICIT map — never a dynamic import of
 * the whole lucide set (bundle size). Unknown/empty slug → null, callers fall
 * back silently (widgets: no chip; actions: Zap).
 */
const DASHBOARD_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  activity: Activity,
  'bell-ring': BellRing,
  briefcase: Briefcase,
  'calendar-clock': CalendarClock,
  'chart-column': ChartColumn,
  'chart-line': ChartLine,
  'database-backup': DatabaseBackup,
  'file-text': FileText,
  folder: Folder,
  gauge: Gauge,
  'hard-drive': HardDrive,
  'image-plus': ImagePlus,
  inbox: Inbox,
  languages: Languages,
  layers: Layers,
  mail: Mail,
  'message-square': MessageSquare,
  newspaper: Newspaper,
  package: Package,
  'package-plus': PackagePlus,
  'refresh-cw': RefreshCw,
  search: Search,
  'search-check': SearchCheck,
  send: Send,
  'shopping-cart': ShoppingCart,
  sparkles: Sparkles,
  'square-pen': SquarePen,
  star: Star,
  timer: Timer,
  'trending-up': TrendingUp,
  users: Users,
  wrench: Wrench,
}

export function dashboardIcon(slug: string | null | undefined): ComponentType<{ className?: string }> | null {
  if (!slug) return null
  return DASHBOARD_ICONS[slug] ?? null
}
