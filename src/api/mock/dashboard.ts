import { formatDistanceToNow } from 'date-fns'
import { de, enUS, es, fr, it, pl, ru, uk } from 'date-fns/locale'

import { getLocale, type AdminLocale } from '@/lib/i18n'
import { actionLabel, entityLabel, entityTitle } from '@/lib/activity-labels'
import { ApiError } from '../client'
import type {
  ActionLayoutOverride,
  ActivityEntry,
  DashboardAction,
  DashboardPayload,
  DashboardWidgetMeta,
  LayoutOverrides,
  Me,
  Period,
  WidgetData,
  WidgetLayoutOverride,
  WidgetSize,
  WidgetType,
} from '../types'
import { rolesStore } from './roles'

/*
 * Mock of the dashboard module (D:dashboard §4/§6): the full v1 widget catalog
 * (UI:dashboard §3) + quick actions + per-role layout overrides. On the real
 * backend each widget is registered by its owning module in boot(); here the
 * registry is one table with fixture data() generators.
 */

const LAYOUTS_KEY = 'mock.dashboardLayouts'
const SIZES: WidgetSize[] = ['sm', 'md', 'lg', 'xl']

const DATE_LOCALES: Record<AdminLocale, typeof ru> = { ru, en: enUS, uk, de, fr, es, it, pl }

function ago(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: DATE_LOCALES[getLocale()] })
}

/** Deterministic pseudo-random series so charts look alive but stable across reloads. */
function series(len: number, base: number, spread: number, seed = 7): number[] {
  const out: number[] = []
  let state = seed
  for (let i = 0; i < len; i++) {
    state = (state * 1103515245 + 12345) % 2147483648
    out.push(Math.max(0, Math.round(base + ((state / 2147483648) - 0.5) * spread + i * (spread / len / 2))))
  }
  return out
}

function days(count: number): string[] {
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 3600 * 1000)
    out.push(`${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

/* ---- period (D:dashboard §4): the window sets the aggregation range, never the
 * row/point budget. The server buckets the span so the series length stays
 * bounded — quarter yields ~13 weekly points, NOT 90 daily ones. ---- */

const PERIODS: Period[] = ['week', 'month', 'quarter']

/** Server-side clamp: an unknown/missing period degrades to the default, never executed as-is. */
export function clampPeriod(raw: string | undefined): Period {
  return PERIODS.includes(raw as Period) ? (raw as Period) : 'month'
}

/** Bucket shape per preset: how many points and how many days each point spans. */
function periodShape(period: Period): { count: number; stepDays: number } {
  switch (period) {
    case 'week':
      return { count: 7, stepDays: 1 }
    case 'quarter':
      return { count: 13, stepDays: 7 } // weekly buckets — bounded, not 90 daily points
    case 'month':
    default:
      return { count: 30, stepDays: 1 }
  }
}

function bucketLabels(period: Period): string[] {
  const { count, stepDays } = periodShape(period)
  const out: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * stepDays * 24 * 3600 * 1000)
    out.push(`${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

/** number[] of the bucketed length (for stat sparklines). */
function bucketSeries(period: Period, base: number, spread: number, seed: number): number[] {
  return series(periodShape(period).count, base, spread, seed)
}

/** {x,y}[] of the bucketed length (for charts); base/spread scale with bucket width. */
function bucketPoints(period: Period, base: number, spread: number, seed: number): { x: string; y: number }[] {
  const { count, stepDays } = periodShape(period)
  const labels = bucketLabels(period)
  return series(count, base * stepDays, spread * stepDays, seed).map((y, i) => ({ x: labels[i]!, y }))
}

/** Flow-total multiplier: how much a per-week total grows across the preset window. */
const PERIOD_FACTOR: Record<Period, number> = { week: 1, month: 4, quarter: 13 }

function rub(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ₽`
}

/** First letters of up to two name words — avatar fallback for list rows. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

/** Extra data a widget fixture needs from the shared mock state (passed by the route layer). */
export interface WidgetContext {
  activity: ActivityEntry[]
}

interface MockWidget {
  key: string
  title_key: string
  permission: string
  type: WidgetType
  size: WidgetSize
  sort: number
  route: string | null
  /** Lucide slug the owning module registers with the widget (D:dashboard §4). */
  icon: string
  /** True → data() reacts to the period window; state widgets omit it and ignore the arg. */
  period_aware?: boolean
  data: (ctx: WidgetContext, period: Period) => WidgetData
}

/** Catalog v1 (UI:dashboard §3) — source of truth per module is its D-spec §6. */
const WIDGETS: MockWidget[] = [
  {
    key: 'pages.count', title_key: 'pages.widget.count', permission: 'pages.view',
    type: 'stat', size: 'sm', sort: 10, route: '/pages', icon: 'file-text', period_aware: true,
    // Total pages is a state value; the period only rescales the trend sparkline/delta window.
    data: (_ctx, period) => ({ value: 24, delta: 4, series: bucketSeries(period, 21, 5, 3), series_labels: bucketLabels(period), compare: { from: 20, to: 24 } }),
  },
  {
    key: 'collections.counts', title_key: 'collections.widget.counts', permission: 'collections.view',
    type: 'list', size: 'sm', sort: 20, route: null, icon: 'layers',
    data: () => ({
      items: [
        { title: 'Блог', leadIcon: 'square-pen', metric: { value: 34, delta: 6 }, hint: '2 черновика', url: '/c/blog' },
        { title: 'Товары', leadIcon: 'package', metric: { value: 148, delta: 3 }, hint: '5 черновиков', url: '/c/products' },
        { title: 'Услуги', leadIcon: 'wrench', metric: { value: 12 }, url: '/c/services' },
        { title: 'Новости', leadIcon: 'newspaper', metric: { value: 27, delta: 12 }, hint: '1 черновик', url: '/c/news' },
        { title: 'Проекты', leadIcon: 'folder', metric: { value: 19 }, url: '/c/projects' },
        { title: 'Вакансии', leadIcon: 'briefcase', metric: { value: 4 }, url: '/c/jobs' },
      ],
    }),
  },
  {
    key: 'forms.week', title_key: 'forms.widget.week', permission: 'forms.submissions',
    type: 'stat', size: 'sm', sort: 30, route: '/forms/submissions', icon: 'send', period_aware: true,
    // Flow total: submissions accumulate over the window, so the value scales with the preset.
    data: (_ctx, period) => {
      const f = PERIOD_FACTOR[period]
      return { value: 18 * f, delta: 12, series: bucketSeries(period, 3, 3, 11), series_labels: bucketLabels(period), compare: { from: 16 * f, to: 18 * f } }
    },
  },
  {
    key: 'forms.recent', title_key: 'forms.widget.recent', permission: 'forms.submissions',
    type: 'list', size: 'md', sort: 40, route: '/forms/submissions', icon: 'inbox',
    data: () => ({
      items: [
        { title: '№432 — «нужен насос для дачи…»', avatar: 'ОС', hint: `Обратная связь · ${ago(new Date(Date.now() - 40 * 60 * 1000))}`, url: '/forms/submissions?id=432', badge: 'new' },
        { title: '№431 — «перезвоните по кровле»', avatar: 'ОЗ', hint: `Обратный звонок · ${ago(new Date(Date.now() - 3 * 3600 * 1000))}`, url: '/forms/submissions?id=431', badge: 'new' },
        { title: '№430 — «сколько стоит монтаж?»', avatar: 'ОС', hint: `Обратная связь · ${ago(new Date(Date.now() - 8 * 3600 * 1000))}`, url: '/forms/submissions?id=430' },
        { title: '№429 — «есть ли ГНОМ-40 в наличии»', avatar: 'ВТ', hint: `Вопрос о товаре · ${ago(new Date(Date.now() - 26 * 3600 * 1000))}`, url: '/forms/submissions?id=429' },
        { title: '№428 — «нужен счёт для юрлица»', avatar: 'ОС', hint: `Обратная связь · ${ago(new Date(Date.now() - 2 * 24 * 3600 * 1000))}`, url: '/forms/submissions?id=428' },
        { title: '№427 — «доставка в Тверь возможна?»', avatar: 'ВТ', hint: `Вопрос о товаре · ${ago(new Date(Date.now() - 2 * 24 * 3600 * 1000 - 5 * 3600 * 1000))}`, url: '/forms/submissions?id=427' },
        { title: '№426 — «подбор насоса по параметрам»', avatar: 'ОС', hint: `Обратная связь · ${ago(new Date(Date.now() - 3 * 24 * 3600 * 1000))}`, url: '/forms/submissions?id=426' },
        { title: '№425 — «гарантия на монтаж»', avatar: 'ОЗ', hint: `Обратный звонок · ${ago(new Date(Date.now() - 3 * 24 * 3600 * 1000 - 7 * 3600 * 1000))}`, url: '/forms/submissions?id=425' },
        { title: '№424 — «нужна смета на кровлю»', avatar: 'ОС', hint: `Обратная связь · ${ago(new Date(Date.now() - 4 * 24 * 3600 * 1000))}`, url: '/forms/submissions?id=424' },
        { title: '№423 — «есть ли скидка от объёма»', avatar: 'ВТ', hint: `Вопрос о товаре · ${ago(new Date(Date.now() - 5 * 24 * 3600 * 1000))}`, url: '/forms/submissions?id=423' },
      ],
    }),
  },
  {
    key: 'orders.week', title_key: 'orders.widget.week', permission: 'orders.view',
    type: 'chart', size: 'lg', sort: 50, route: '/shop/orders', icon: 'chart-column', period_aware: true,
    // Bucketed x-axis: quarter → ~13 weekly bars, NOT 90 daily ones (window ≠ budget).
    data: (_ctx, period) => ({
      kind: 'bar',
      summary: { total: rub(312400 * PERIOD_FACTOR[period]), delta: 12 },
      reference: { y: 52, label_key: 'dashboard.avg' },
      series: [
        { label_key: 'orders.widget.series_orders', points: bucketPoints(period, 6, 6, 5) },
        { label_key: 'orders.widget.series_revenue', points: bucketPoints(period, 52, 40, 17) },
      ],
    }),
  },
  {
    key: 'orders.recent', title_key: 'orders.widget.recent', permission: 'orders.view',
    type: 'list', size: 'md', sort: 60, route: '/shop/orders', icon: 'shopping-cart',
    data: () => ({
      items: [
        { title: '№1046 · 24 900 ₽', avatar: 'ИФ', hint: 'Ирина Фролова', url: '/shop/orders?id=1046', badge: 'new' },
        { title: '№1045 · 12 400 ₽', avatar: 'ПМ', hint: 'Павел Морозов', url: '/shop/orders?id=1045', badge: 'paid' },
        { title: '№1044 · 3 150 ₽', avatar: 'МК', hint: 'Мария Кузнецова', url: '/shop/orders?id=1044', badge: 'paid' },
        { title: '№1043 · 41 700 ₽', avatar: 'СС', hint: 'ООО «Стройсервис»', url: '/shop/orders?id=1043', badge: 'shipped' },
        { title: '№1042 · 8 200 ₽', avatar: 'ДС', hint: 'Дмитрий Соколов', url: '/shop/orders?id=1042', badge: 'done' },
        { title: '№1041 · 15 300 ₽', avatar: 'АБ', hint: 'Анна Белова', url: '/shop/orders?id=1041', badge: 'done' },
        { title: '№1040 · 6 750 ₽', avatar: 'ВК', hint: 'Виктор Ким', url: '/shop/orders?id=1040', badge: 'done' },
        { title: '№1039 · 92 000 ₽', avatar: 'АС', hint: 'ООО «Аквастрой»', url: '/shop/orders?id=1039', badge: 'done' },
        { title: '№1038 · 4 400 ₽', avatar: 'ЕГ', hint: 'Елена Гусева', url: '/shop/orders?id=1038', badge: 'done' },
      ],
    }),
  },
  {
    key: 'scheduler.queue', title_key: 'scheduler.widget.queue', permission: 'scheduler.view',
    type: 'status', size: 'sm', sort: 70, route: '/system/scheduler', icon: 'timer',
    data: () => ({
      rows: [
        { label_key: 'scheduler.widget.pending', value: '3', state: 'ok' as const, url: '/system/scheduler' },
        { label_key: 'scheduler.widget.failed', value: '0', state: 'ok' as const, url: '/system/scheduler' },
        { label_key: 'scheduler.widget.last_tick', value: ago(new Date(Date.now() - 2 * 60 * 1000)), state: 'ok' as const },
      ],
    }),
  },
  {
    key: 'backups.last', title_key: 'backups.widget.last', permission: 'backups.view',
    type: 'status', size: 'sm', sort: 80, route: '/system/backups', icon: 'database-backup',
    data: () => ({
      rows: [
        { label_key: 'backups.widget.age', value: ago(new Date(Date.now() - 5 * 3600 * 1000)), state: 'ok' as const, url: '/system/backups' },
        { label_key: 'backups.widget.size', value: '184 MB', state: 'ok' as const },
        // DB size lives here (dashboard plan decision 2) — no separate widget.
        { label_key: 'backups.widget.db_size', value: '42 MB', state: 'ok' as const },
      ],
    }),
  },
  {
    key: 'updates.available', title_key: 'updates.widget.available', permission: 'updates.view',
    type: 'status', size: 'sm', sort: 90, route: '/system/updates', icon: 'refresh-cw',
    data: () => ({
      rows: [
        { label_key: 'updates.widget.version', value: '1.4.2', state: 'ok' as const },
        { label_key: 'updates.widget.latest', value: '1.5.0', state: 'warn' as const, url: '/system/updates' },
      ],
    }),
  },
  {
    key: 'auth.activity', title_key: 'activity.widget.title', permission: 'activity.view',
    type: 'list', size: 'lg', sort: 100, route: '/system/activity', icon: 'activity',
    data: (ctx) => ({
      items: ctx.activity.slice(0, 10).map((entry) => {
        const name = entry.is_ai ? 'AI' : entry.actor?.name ?? '—'
        // Show WHAT changed: "{action}: {subject}" as title, actor · entity-type · time as hint.
        return {
          title: `${actionLabel(entry.action)}: ${entityTitle(entry)}`,
          hint: `${name} · ${entityLabel(entry.entity_type)} · ${ago(entry.created_at)}`,
          url: entry.url ?? '/system/activity',
          ...(entry.is_ai
            ? { leadIcon: 'sparkles' as const }
            : { avatar: initials(name) }),
        }
      }),
    }),
  },
  {
    key: 'i18n.coverage', title_key: 'i18n.widget.coverage', permission: 'i18n.view',
    type: 'stat', size: 'sm', sort: 110, route: '/i18n', icon: 'languages',
    // Flat tail on purpose — verifies the sparkline renders a near-flat series without errors.
    data: () => ({ value: '86%', delta: 3, series: [71, 74, 78, 80, 83, 84, 85, 85, 86, 86, 86, 86], series_labels: days(12), compare: { from: '83%', to: '86%' } }),
  },
  {
    key: 'reviews.pending', title_key: 'reviews.widget.pending', permission: 'reviews.moderate',
    type: 'stat', size: 'sm', sort: 120, route: '/reviews', icon: 'star', period_aware: true,
    // Pending count is current state; the period rescales the trend window only.
    data: (_ctx, period) => ({ value: 5, delta: 2, series: bucketSeries(period, 3, 3, 23), series_labels: bucketLabels(period), compare: { from: 3, to: 5 } }),
  },
  {
    key: 'reviews.recent', title_key: 'reviews.widget.recent', permission: 'reviews.moderate',
    type: 'list', size: 'md', sort: 130, route: '/reviews', icon: 'message-square',
    data: () => ({
      items: [
        { title: 'Мария К.', avatar: 'МК', hint: 'Насос ГНОМ-25', rating: 5, url: '/reviews', badge: 'new' },
        { title: 'Игорь В.', avatar: 'ИВ', hint: 'Кровельные работы', rating: 4, url: '/reviews', badge: 'new' },
        { title: 'Ольга П.', avatar: 'ОП', hint: 'Насос дренажный НД-40', rating: 3, url: '/reviews' },
        { title: 'Сергей К.', avatar: 'СК', hint: 'Монтаж под ключ', rating: 5, url: '/reviews' },
        { title: 'Андрей Л.', avatar: 'АЛ', hint: 'Насос ГНОМ-40', rating: 4, url: '/reviews' },
        { title: 'Наталья Р.', avatar: 'НР', hint: 'Ремонт кровли', rating: 5, url: '/reviews' },
        { title: 'Пётр Д.', avatar: 'ПД', hint: 'Доставка', rating: 2, url: '/reviews' },
        { title: 'Ксения М.', avatar: 'КМ', hint: 'Консультация инженера', rating: 5, url: '/reviews' },
      ],
    }),
  },
  {
    key: 'analytics.sessions', title_key: 'analytics.widget.sessions', permission: 'analytics.view',
    type: 'chart', size: 'md', sort: 140, route: '/analytics', icon: 'chart-line', period_aware: true,
    data: (_ctx, period) => ({
      kind: 'line',
      summary: { total: Math.round(3420 * PERIOD_FACTOR[period]).toLocaleString('ru-RU'), delta: 6 },
      reference: { y: 120, label_key: 'dashboard.avg' },
      series: [
        { label_key: 'analytics.widget.series_sessions', points: bucketPoints(period, 120, 70, 41) },
        { label_key: 'dashboard.prev_period', points: bucketPoints(period, 108, 60, 61), dashed: true },
      ],
    }),
  },
  {
    key: 'analytics.users_today', title_key: 'analytics.widget.users_today', permission: 'analytics.view',
    type: 'stat', size: 'sm', sort: 150, route: '/analytics', icon: 'users',
    data: () => ({ value: 142, delta: -8, series: series(14, 130, 40, 29), series_labels: days(14), compare: { from: 154, to: 142 }, goal: { target: 200, label_key: 'dashboard.goal' } }),
  },
  {
    key: 'analytics.top_pages', title_key: 'analytics.widget.top_pages', permission: 'analytics.view',
    type: 'list', size: 'md', sort: 160, route: '/analytics', icon: 'trending-up', period_aware: true,
    // Period widens the window (views scale), but the list stays ≤10 rows — window ≠ budget.
    data: (_ctx, period) => {
      const n = (v: number) => Math.round(v * PERIOD_FACTOR[period]).toLocaleString('ru-RU')
      return {
        items: [
          { title: 'Главная', hint: '/', metric: { value: n(2431), delta: 8 } },
          { title: 'Насос ГНОМ-25', hint: '/nasosy/gnom-25', metric: { value: n(1204), delta: 14 } },
          { title: 'Кровельные работы', hint: '/uslugi/krovlya', metric: { value: n(862), delta: -3 } },
          { title: 'О компании', hint: '/o-kompanii', metric: { value: n(514) } },
          { title: 'Контакты', hint: '/kontakty', metric: { value: n(447), delta: 2 } },
          { title: 'Насос НД-40', hint: '/nasosy/nd-40', metric: { value: n(391) } },
          { title: 'Как выбрать насос', hint: '/blog/kak-vybrat-nasos', metric: { value: n(356), delta: 22 } },
          { title: 'Монтаж под ключ', hint: '/uslugi/montazh', metric: { value: n(298) } },
          { title: 'Доставка', hint: '/dostavka', metric: { value: n(245) } },
          { title: 'Ремонт кровли зимой', hint: '/blog/remont-krovli-zimoy', metric: { value: n(203) } },
        ],
      }
    },
  },
  {
    key: 'ai.spend', title_key: 'ai.widget.spend', permission: 'ai.manage',
    type: 'stat', size: 'sm', sort: 170, route: '/system/ai', icon: 'sparkles', period_aware: true,
    // Flow total: spend accrues over the window.
    data: (_ctx, period) => {
      const f = PERIOD_FACTOR[period]
      return { value: `$${(4.2 * f).toFixed(2)}`, delta: 18, series: bucketSeries(period, 3, 4, 13), series_labels: bucketLabels(period), compare: { from: `$${(3.6 * f).toFixed(2)}`, to: `$${(4.2 * f).toFixed(2)}` } }
    },
  },
  {
    key: 'pages.pipeline', title_key: 'pages.widget.pipeline', permission: 'pages.view',
    type: 'list', size: 'md', sort: 15, route: '/pages', icon: 'calendar-clock',
    data: () => ({
      items: [
        { title: 'Акция «Зимний монтаж»', leadIcon: 'calendar-clock', hint: `Выйдет ${ago(new Date(Date.now() + 2 * 24 * 3600 * 1000))}`, url: '/pages', badge: 'scheduled' },
        { title: 'Прайс-лист 2026', leadIcon: 'calendar-clock', hint: `Выйдет ${ago(new Date(Date.now() + 5 * 24 * 3600 * 1000))}`, url: '/pages', badge: 'scheduled' },
        { title: 'О производстве', leadIcon: 'square-pen', hint: 'Черновик · ред. вчера', url: '/pages', badge: 'draft' },
        { title: 'Гарантия и сервис', leadIcon: 'square-pen', hint: 'Черновик · ред. 3 дня назад', url: '/pages', badge: 'draft' },
        { title: 'Доставка по регионам', leadIcon: 'square-pen', hint: 'Черновик · ред. неделю назад', url: '/pages', badge: 'draft' },
      ],
    }),
  },
  {
    key: 'media.storage', title_key: 'media.widget.storage', permission: 'media.view',
    type: 'status', size: 'sm', sort: 85, route: '/media', icon: 'hard-drive',
    data: () => ({
      rows: [
        { label_key: 'media.widget.used', value: '1,2 ГБ', state: 'ok' as const, url: '/media' },
        { label_key: 'media.widget.files', value: '312', state: 'ok' as const },
        { label_key: 'media.widget.quota', value: '37% из 5 ГБ', state: 'ok' as const },
      ],
    }),
  },
  {
    key: 'mail.queue', title_key: 'mail.widget.queue', permission: 'mail.view',
    type: 'status', size: 'sm', sort: 95, route: '/system/mail', icon: 'mail',
    data: () => ({
      rows: [
        { label_key: 'mail.widget.sent', value: '86', state: 'ok' as const, trend: 9, url: '/system/mail' },
        { label_key: 'mail.widget.queued', value: '2', state: 'ok' as const, url: '/system/mail' },
        { label_key: 'mail.widget.failed', value: '1', state: 'warn' as const, url: '/system/mail' },
      ],
    }),
  },
  {
    key: 'search.queries', title_key: 'search.widget.queries', permission: 'search.manage',
    type: 'list', size: 'md', sort: 165, route: '/search', icon: 'search',
    data: () => ({
      items: [
        { title: 'насос гном 25', metric: { value: 312, delta: 14 }, url: '/search' },
        { title: 'дренажный насос', metric: { value: 208, delta: 5 }, url: '/search' },
        { title: 'монтаж кровли цена', metric: { value: 154 }, url: '/search' },
        { title: 'нд-40 характеристики', metric: { value: 97 }, url: '/search' },
        // Zero-result queries — the actionable signal for content gaps (search widget).
        { title: 'скважинный адаптер', hint: 'нет результатов', url: '/search' },
        { title: 'септик для дачи', hint: 'нет результатов', url: '/search' },
        { title: 'ремонт насосной станции', hint: 'нет результатов', url: '/search' },
      ],
    }),
  },
  {
    key: 'seo.health', title_key: 'seo.widget.health', permission: 'seo.manage',
    type: 'status', size: 'sm', sort: 168, route: '/seo', icon: 'search-check',
    data: () => ({
      rows: [
        { label_key: 'seo.widget.no_meta', value: '7', state: 'warn' as const, url: '/seo' },
        { label_key: 'seo.widget.noindex', value: '4', state: 'ok' as const, url: '/seo' },
        { label_key: 'seo.widget.notfound', value: '38 / сут', state: 'warn' as const, trend: 24, url: '/redirects' },
      ],
    }),
  },
]

/** Quick actions v1 (UI:dashboard §3); label keys are reused from the ⌘K palette. */
/** `sort` is the registration-default order (overridden per-role via layouts.actions). */
const ACTIONS: Array<DashboardAction & { permission: string; sort: number }> = [
  { key: 'pages.create', label_key: 'action.createPage', icon: 'square-pen', route: '/pages/new', permission: 'pages.manage', sort: 10 },
  { key: 'media.upload', label_key: 'action.uploadMedia', icon: 'image-plus', route: '/media?upload=1', permission: 'media.manage', sort: 20 },
  { key: 'catalog.product', label_key: 'action.newProduct', icon: 'package-plus', route: '/c/products/new', permission: 'collections.products.manage', sort: 30 },
  { key: 'posts.post', label_key: 'action.newPost', icon: 'square-pen', route: '/c/blog/new', permission: 'collections.blog.manage', sort: 40 },
  { key: 'forms.submissions', label_key: 'action.openSubmissions', icon: 'send', route: '/forms/submissions', permission: 'forms.submissions', sort: 50 },
  { key: 'cache.clear', label_key: 'action.clearCache', icon: 'gauge', api: 'cache.clear', confirm: true, permission: 'cache.manage', sort: 60 },
]

type MockAction = (typeof ACTIONS)[number]

/* ---- per-role layout overrides (settings key dashboard.layouts, D:dashboard §3) ---- */

function layouts(): Record<string, LayoutOverrides> {
  try {
    return JSON.parse(localStorage.getItem(LAYOUTS_KEY) ?? '{}') as Record<string, LayoutOverrides>
  } catch {
    return {}
  }
}

function persistLayouts(all: Record<string, LayoutOverrides>): void {
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(all))
}

function requireManage(me: Me): void {
  if (!me.permissions.includes('dashboard.manage')) throw new ApiError(403, 'Forbidden')
}

/** Permission set of a role; null → all (the system admin role, mirroring RoleMatrix). */
function rolePermissions(roleKey: string): Set<string> | null {
  const role = rolesStore().find((candidate) => candidate.key === roleKey)
  if (!role) throw new ApiError(422, 'Unknown role', 'unknown_role')
  return role.is_system ? null : new Set(role.permissions)
}

/** Normalized role layout: always both maps present (old flat/malformed storage degrades to defaults). */
type NormalizedLayout = {
  widgets: Record<string, WidgetLayoutOverride>
  actions: Record<string, ActionLayoutOverride>
}

function roleLayout(roleKey: string): NormalizedLayout {
  const raw = layouts()[roleKey]
  return { widgets: raw?.widgets ?? {}, actions: raw?.actions ?? {} }
}

function effective(widget: MockWidget, overrides: NormalizedLayout): Required<WidgetLayoutOverride> {
  const override = overrides.widgets[widget.key] ?? {}
  return {
    size: override.size ?? widget.size,
    sort: override.sort ?? widget.sort,
    hidden: override.hidden ?? false,
  }
}

function effectiveAction(action: MockAction, overrides: NormalizedLayout): Required<ActionLayoutOverride> {
  const override = overrides.actions[action.key] ?? {}
  return {
    sort: override.sort ?? action.sort,
    hidden: override.hidden ?? false,
  }
}

export function getDashboard(me: Me, roleParam?: string): DashboardPayload {
  const customize = roleParam !== undefined && roleParam !== ''
  if (customize) requireManage(me)

  const roleKey = customize ? roleParam : me.user.role.key
  const permitted = customize ? rolePermissions(roleKey) : new Set(me.permissions)
  const overrides = roleLayout(roleKey)

  const widgets: DashboardWidgetMeta[] = WIDGETS
    .filter((widget) => permitted === null || permitted.has(widget.permission))
    .map((widget) => {
      const eff = effective(widget, overrides)
      const meta: DashboardWidgetMeta = {
        key: widget.key,
        title_key: widget.title_key,
        type: widget.type,
        size: eff.size,
        sort: eff.sort,
        route: widget.route,
        icon: widget.icon,
      }
      // Only period-aware widgets carry the flag — the SPA re-queries just those on a period switch.
      if (widget.period_aware) meta.period_aware = true
      // Hidden widgets stay in the customize payload (flagged) so the panel can restore them.
      if (customize) meta.hidden = eff.hidden
      return customize || !eff.hidden ? meta : null
    })
    .filter((meta): meta is DashboardWidgetMeta => meta !== null)
    .sort((a, b) => a.sort - b.sort || a.key.localeCompare(b.key))

  // Actions mirror widgets: RBAC by the TARGET role (customize) or the user (normal),
  // then per-role order/hidden overrides. Hidden actions stay in the customize payload (flagged).
  const actions = ACTIONS
    .filter((action) => permitted === null || permitted.has(action.permission))
    .map((action) => {
      const eff = effectiveAction(action, overrides)
      const { permission: _permission, sort: _sort, ...rest } = action
      const dto: DashboardAction = { ...rest }
      if (customize) dto.hidden = eff.hidden
      return { dto, sort: eff.sort, hidden: eff.hidden }
    })
    .filter((entry) => customize || !entry.hidden)
    .sort((a, b) => a.sort - b.sort || a.dto.key.localeCompare(b.dto.key))
    .map((entry) => entry.dto)

  return { widgets, actions }
}

export function getWidgetData(key: string, me: Me, ctx: WidgetContext, period: Period): WidgetData {
  const widget = WIDGETS.find((candidate) => candidate.key === key)
  if (!widget) throw new ApiError(404, 'Unknown widget')
  // RBAC is server-side per widget (D:dashboard §9) — layout can't bypass it.
  if (!me.permissions.includes(widget.permission)) throw new ApiError(403, 'Forbidden')
  // period is already clamped by the route layer; non-period widgets ignore the arg.
  return widget.data(ctx, period)
}

export function saveDashboardLayout(me: Me, roleKey: string, body: LayoutOverrides): { ok: true } {
  requireManage(me)
  rolePermissions(roleKey) // 422 on unknown role

  const knownWidgets = new Set(WIDGETS.map((widget) => widget.key))
  const cleanWidgets: Record<string, WidgetLayoutOverride> = {}
  for (const [key, override] of Object.entries(body?.widgets ?? {})) {
    if (!knownWidgets.has(key)) continue // unknown/disabled widget keys are ignored, not an error
    const entry: WidgetLayoutOverride = {}
    if (override.size !== undefined && SIZES.includes(override.size)) entry.size = override.size
    if (typeof override.sort === 'number') entry.sort = override.sort
    if (typeof override.hidden === 'boolean') entry.hidden = override.hidden
    cleanWidgets[key] = entry
  }

  const knownActions = new Set(ACTIONS.map((action) => action.key))
  const cleanActions: Record<string, ActionLayoutOverride> = {}
  for (const [key, override] of Object.entries(body?.actions ?? {})) {
    if (!knownActions.has(key)) continue // unknown/disabled action keys are ignored (no size for actions)
    const entry: ActionLayoutOverride = {}
    if (typeof override.sort === 'number') entry.sort = override.sort
    if (typeof override.hidden === 'boolean') entry.hidden = override.hidden
    cleanActions[key] = entry
  }

  const all = layouts()
  all[roleKey] = { widgets: cleanWidgets, actions: cleanActions }
  persistLayouts(all)
  return { ok: true }
}

export function resetDashboardLayout(me: Me, roleKey: string): { ok: true } {
  requireManage(me)
  rolePermissions(roleKey)
  const all = layouts()
  delete all[roleKey]
  persistLayouts(all)
  return { ok: true }
}
