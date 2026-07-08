import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router'
import type { ColumnDef } from '@tanstack/react-table'

import { api, type ProductListItem, type ProductStatus } from '@/api'
import { DataTable, type RowAction } from '@/components/data-table'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { SearchInput } from '@/components/toolbar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatMoney } from '@/lib/money'
import { t } from '@/lib/i18n'
import { useListParams } from '@/lib/list-params'
import { useLocale } from '@/lib/use-locale'

/*
 * /shop/products (build-demo-screen-catalog): products catalog list. Thumbnail,
 * name, SKU, price, stock and status; search + status filter in the URL. Row "⋯"
 * opens the editor; the header primary action creates a new product.
 */

const STATUS_KIND: Record<ProductStatus, StatusKind> = {
  active: 'success',
  draft: 'pending',
  archived: 'archived',
}

const PRODUCT_STATUSES: ProductStatus[] = ['active', 'draft', 'archived']

function ProductThumb({ src, name }: { src?: string; name: string }) {
  const usable = src && (src.startsWith('data:') || src.startsWith('http'))
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
      {usable ? <img src={src} alt={name} className="size-full object-cover" /> : <Package className="size-4" />}
    </span>
  )
}

export function ProductsPage() {
  const locale = useLocale()
  const navigate = useNavigate()
  const params = useListParams()

  const filters = {
    page: params.page,
    q: params.query || undefined,
    status: (params.filter('status') as ProductStatus | undefined) ?? undefined,
    sort: (params.sort?.column as 'name' | 'price' | 'stock' | undefined) ?? 'name',
    dir: params.sort?.dir ?? ('asc' as const),
  }

  console.debug('[ProductsPage] query', filters)

  const listQuery = useQuery({
    queryKey: ['shop', 'products', filters],
    queryFn: () => api.products.list(filters),
    placeholderData: (previous) => previous,
  })

  const columns = useMemo<ColumnDef<ProductListItem>[]>(
    () => [
      {
        id: 'name',
        header: t('shop.products.col.name'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <ProductThumb src={row.original.image} name={row.original.name} />
            <span className="truncate font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: 'sku',
        header: t('shop.products.col.sku'),
        meta: { className: 'max-md:hidden' },
        cell: ({ row }) => <span className="whitespace-nowrap text-muted-foreground">{row.original.sku}</span>,
      },
      {
        id: 'price',
        header: t('shop.products.col.price'),
        meta: { sortable: true },
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatMoney(row.original.price, row.original.currency, locale)}
          </span>
        ),
      },
      {
        id: 'stock',
        header: t('shop.products.col.stock'),
        meta: { sortable: true, className: 'max-sm:hidden' },
        cell: ({ row }) => (
          <span className={row.original.stock === 0 ? 'text-destructive' : 'tabular-nums'}>
            {row.original.stock === 0 ? t('shop.products.out_of_stock') : row.original.stock}
          </span>
        ),
      },
      {
        id: 'status',
        header: t('shop.products.col.status'),
        cell: ({ row }) => (
          <StatusBadge
            status={STATUS_KIND[row.original.status]}
            label={t(`shop.products.status.${row.original.status}`)}
          />
        ),
      },
    ],
    [locale],
  )

  const rowActions: RowAction<ProductListItem>[] = [
    {
      key: 'edit',
      label: t('common.edit'),
      icon: <Pencil />,
      permission: 'products.manage',
      onSelect: (product) => navigate(`/shop/products/${product.id}`),
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
      <PageHeader
        title={t('nav.products')}
        icon={Package}
        primaryAction={{
          label: t('shop.products.add'),
          href: '/shop/products/new',
          permission: 'products.manage',
        }}
      />

      <Panel
        icon={Package}
        title={t('nav.products')}
        description={t('shop.products.hint')}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={params.search}
              onChange={params.setSearch}
              placeholder={t('shop.products.search_placeholder')}
              className="w-56"
            />
            <Select
              value={filters.status ?? 'all'}
              onValueChange={(value) => params.setFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('shop.products.filter.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('shop.products.filter.all_statuses')}</SelectItem>
                {PRODUCT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`shop.products.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<ProductListItem>
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
          sort={params.sort ?? { column: 'name', dir: 'asc' }}
          onSort={(column, dir) => params.setSort(column, dir)}
          onPage={(page) => params.setPage(page)}
          onRetry={() => void listQuery.refetch()}
          emptyState={{
            title: t('shop.products.empty'),
            description: t('shop.products.empty_hint'),
          }}
        />
      </Panel>
    </div>
  )
}
