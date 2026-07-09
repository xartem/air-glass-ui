import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { de, enUS, es, fr, it, pl, ru, uk } from 'date-fns/locale'
import { Eye, ReceiptText } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { api, type InvoiceListItem, type InvoiceStatus } from '@/api'
import { DataTable, type RowAction } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { SearchInput } from '@/components/toolbar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatMoney } from '@/lib/money'
import { t, type AdminLocale } from '@/lib/i18n'
import { useListParams } from '@/lib/list-params'
import { useLocale } from '@/lib/use-locale'

/*
 * /shop/invoices (build-demo-screen-catalog): invoice list. Number, customer,
 * issue/due dates, amount and status; search + status filter in the URL. Row "⋯"
 * opens the print-ready invoice detail.
 */

const DATE_LOCALES: Record<AdminLocale, typeof ru> = { ru, en: enUS, uk, de, fr, es, it, pl }

const STATUS_KIND: Record<InvoiceStatus, StatusKind> = {
  paid: 'success',
  overdue: 'error',
  draft: 'pending',
  sent: 'info',
}

const INVOICE_STATUSES: InvoiceStatus[] = ['paid', 'sent', 'overdue', 'draft']

export function InvoicesPage() {
  const locale = useLocale()
  const navigate = useNavigate()
  const params = useListParams()

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter('status') as InvoiceStatus | undefined) ?? undefined,
    sort: (params.sort?.column as 'number' | 'issued_at' | 'amount' | undefined) ?? 'issued_at',
    dir: params.sort?.dir ?? ('desc' as const),
  }

  console.debug('[InvoicesPage] query', filters)

  const listQuery = useQuery({
    queryKey: ['shop', 'invoices', filters],
    queryFn: () => api.invoices.list(filters),
    placeholderData: (previous) => previous,
  })

  const columns = useMemo<ColumnDef<InvoiceListItem>[]>(
    () => [
      {
        id: 'number',
        header: t('shop.invoices.col.number'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium">{row.original.number}</div>
            <div className="truncate text-xs text-muted-foreground">{row.original.customer_name}</div>
          </div>
        ),
      },
      {
        id: 'issued_at',
        header: t('shop.invoices.col.issued'),
        meta: { sortable: true, className: 'max-md:hidden' },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {format(new Date(row.original.issued_at), 'PP', { locale: DATE_LOCALES[locale] })}
          </span>
        ),
      },
      {
        id: 'due_at',
        header: t('shop.invoices.col.due'),
        meta: { className: 'max-lg:hidden' },
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {format(new Date(row.original.due_at), 'PP', { locale: DATE_LOCALES[locale] })}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('shop.invoices.col.status'),
        cell: ({ row }) => (
          <StatusBadge status={STATUS_KIND[row.original.status]} label={t(`shop.invoices.status.${row.original.status}`)} />
        ),
      },
      {
        id: 'amount',
        header: t('shop.invoices.col.amount'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap font-medium tabular-nums">
            {formatMoney(row.original.amount, row.original.currency, locale)}
          </span>
        ),
      },
    ],
    [locale],
  )

  const rowActions: RowAction<InvoiceListItem>[] = [
    {
      key: 'view',
      label: t('shop.invoices.view'),
      icon: <Eye />,
      onSelect: (invoice) => navigate(`/shop/invoices/${invoice.id}`),
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
      <PageHeader title={t('nav.invoices')} icon={ReceiptText} />

      <Panel
        icon={ReceiptText}
        title={t('nav.invoices')}
        description={t('shop.invoices.hint')}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t('shop.invoices.search_placeholder')}
              className="w-56"
            />
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => params.setFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('shop.invoices.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shop.invoices.filter.all_statuses')}</SelectItem>
                {INVOICE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.invoices.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<InvoiceListItem>
          label={t('nav.invoices')}
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
          sort={params.sort ?? { column: 'issued_at', dir: 'desc' }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{ title: t('shop.invoices.empty'), description: t('shop.invoices.empty_hint') }}
        />
      </Panel>
    </div>
  )
}
