import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { de, enUS, es, fr, it, pl, ru, uk } from 'date-fns/locale'
import { Eye, ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { api, type OrderListItem, type OrderStatus, type PaymentState } from '@/api'
import { DataTable, type RowAction } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { SearchInput } from '@/components/toolbar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoney } from '@/lib/money'
import { t, type AdminLocale } from '@/lib/i18n'
import { useListParams } from '@/lib/list-params'
import { useLocale } from '@/lib/use-locale'

/*
 * /shop/orders (build-demo-screen-catalog): e-commerce orders list. Search +
 * status + date-range filters live in the URL (useListParams); the table paginates
 * server-style against the mock. Row "⋯" opens the order detail. Status/payment
 * pills use the shared StatusBadge color map — no per-screen colors.
 */

const DATE_LOCALES: Record<AdminLocale, typeof ru> = {
  ru,
  en: enUS,
  uk,
  de,
  fr,
  es,
  it,
  pl,
}

const STATUS_KIND: Record<OrderStatus, StatusKind> = {
  pending: 'pending',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'archived',
  refunded: 'error',
}

const PAYMENT_KIND: Record<PaymentState, StatusKind> = {
  paid: 'success',
  unpaid: 'pending',
  partial: 'info',
  refunded: 'error',
}

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

export function OrdersPage() {
  const locale = useLocale()
  const navigate = useNavigate()
  const params = useListParams()

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter('status') as OrderStatus | undefined) ?? undefined,
    from: params.filter('from'),
    to: params.filter('to'),
    sort: (params.sort?.column as 'number' | 'created_at' | 'total' | undefined) ?? 'created_at',
    dir: params.sort?.dir ?? ('desc' as const),
  }

  console.debug('[OrdersPage] query', filters)

  const listQuery = useQuery({
    queryKey: ['shop', 'orders', filters],
    queryFn: () => api.orders.list(filters),
    placeholderData: (previous) => previous,
  })

  const columns = useMemo<ColumnDef<OrderListItem>[]>(
    () => [
      {
        id: 'number',
        header: t('shop.orders.col.number'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium">{row.original.number}</div>
            <div className="text-xs text-muted-foreground">
              {t('shop.orders.items_count', {
                count: row.original.items_count,
              })}
            </div>
          </div>
        ),
      },
      {
        id: 'customer',
        header: t('shop.orders.col.customer'),
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.customer_name}</span>,
      },
      {
        id: 'created_at',
        header: t('shop.orders.col.date'),
        meta: { sortable: true, className: 'max-md:hidden' },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {format(new Date(row.original.created_at), 'PP', {
              locale: DATE_LOCALES[locale],
            })}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('shop.orders.col.status'),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.orders.status.${row.original.status}`)}
          />
        ),
      },
      {
        id: 'payment',
        header: t('shop.orders.col.payment'),
        meta: { className: 'max-md:hidden' },
        cell: ({ row }) => (
          <StatusBadge
            status={PAYMENT_KIND[row.original.payment_status]}
            label={t(`shop.orders.payment.${row.original.payment_status}`)}
          />
        ),
      },
      {
        id: 'total',
        header: t('shop.orders.col.total'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatMoney(row.original.total, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [locale],
  )

  const rowActions: RowAction<OrderListItem>[] = [
    {
      key: 'view',
      label: t('shop.orders.view'),
      icon: <Eye />,
      onSelect: (order) => {
        console.debug('[OrdersPage] open', { id: order.id })
        navigate(`/shop/orders/${order.id}`)
      },
    },
  ]

  const data = listQuery.data
  const state = listQuery.isPending
    ? 'loading'
    : listQuery.isError
      ? 'error'
      : (data?.rows.length ?? 0) === 0
        ? 'empty'
        : 'ready'

  return (
    <div className="space-y-4">
      <PageHeader title={t('nav.orders')} icon={ShoppingCart} />

      <Panel
        icon={ShoppingCart}
        title={t('nav.orders')}
        description={t('shop.orders.hint')}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t('shop.orders.search_placeholder')}
              className="w-56"
            />
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => params.setFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('shop.orders.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shop.orders.filter.all_statuses')}</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.orders.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              aria-label={t('shop.orders.filter.from')}
              value={filters.from ?? ''}
              onChange={(event) => params.setFilter('from', event.target.value || undefined)}
              className="w-40"
            />
            <Input
              type="date"
              aria-label={t('shop.orders.filter.to')}
              value={filters.to ?? ''}
              onChange={(event) => params.setFilter('to', event.target.value || undefined)}
              className="w-40"
            />
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<OrderListItem>
          columns={columns}
          data={data?.rows ?? []}
          state={state}
          rowActions={rowActions}
          getRowId={(row) => String(row.id)}
          pagination={
            data
              ? {
                  page: data.page,
                  perPage: data.per_page,
                  total: data.total,
                  pages: Math.max(1, Math.ceil(data.total / data.per_page)),
                }
              : undefined
          }
          sort={params.sort ?? { column: 'created_at', dir: 'desc' }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t('shop.orders.empty'),
            description: t('shop.orders.empty_hint'),
          }}
        />
      </Panel>
    </div>
  )
}
