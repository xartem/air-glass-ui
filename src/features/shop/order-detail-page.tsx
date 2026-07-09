import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { de, enUS, es, fr, it, pl, ru, uk } from 'date-fns/locale'
import { ArrowLeft, CreditCard, MapPin, Package, ShoppingCart, Truck } from 'lucide-react'
import { useParams } from 'react-router'
import { toast } from 'sonner'

import { api, type OrderDetail, type OrderStatus } from '@/api'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/panel'
import { StatusBadge, type StatusKind } from '@/components/status-badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { formatMoney } from '@/lib/money'
import { t, type AdminLocale } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'

/*
 * /shop/orders/{id} (build-demo-screen-catalog): order detail. Header carries the
 * order number, status badge and a status-change control (optimistic mock mutation
 * + toast; cancel/refund pass through ConfirmDialog). Body: line items, party
 * panels (customer/shipping/billing), a totals summary and an order timeline.
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

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const DESTRUCTIVE_STATUSES: OrderStatus[] = ['cancelled', 'refunded']

function Party({
  icon: Icon,
  title,
  name,
  lines,
}: {
  icon: typeof MapPin
  title: string
  name: string
  lines: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </div>
      <div className="text-sm">{name}</div>
      <div className="whitespace-pre-line text-xs text-muted-foreground">{lines}</div>
    </div>
  )
}

export function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const locale = useLocale()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<OrderStatus | null>(null)

  const orderQuery = useQuery({
    queryKey: ['shop', 'orders', 'detail', orderId],
    queryFn: () => api.orders.get(orderId),
  })

  console.debug('[OrderDetailPage] load', { id: orderId })

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => api.orders.setStatus(orderId, status),
    onSuccess: (detail) => {
      console.debug('[OrderDetailPage] status changed', {
        id: orderId,
        status: detail.status,
      })
      queryClient.setQueryData(['shop', 'orders', 'detail', orderId], detail)
      void queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] })
      toast.success(t('shop.orders.detail.status_saved'))
    },
    onError: () => toast.error(t('common.request_failed')),
  })

  function changeStatus(status: OrderStatus) {
    console.debug('[OrderDetailPage] submit status', { id: orderId, status })
    if (DESTRUCTIVE_STATUSES.includes(status)) {
      setPending(status)
      return
    }
    statusMutation.mutate(status)
  }

  if (orderQuery.isError) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t('shop.orders.detail.title')}
          icon={ShoppingCart}
          breadcrumbs={[{ label: t('nav.orders'), href: '/shop/orders' }, { label: t('shop.orders.detail.title') }]}
        />
        <Panel>
          <EmptyState
            title={t('table.error.title')}
            description={t('table.error.description')}
            action={{
              label: t('common.retry'),
              onClick: () => void orderQuery.refetch(),
            }}
          />
        </Panel>
      </div>
    )
  }

  const order: OrderDetail | undefined = orderQuery.data
  const loading = orderQuery.isPending

  return (
    <div className="space-y-4">
      <PageHeader
        title={order ? t('shop.orders.detail.heading', { number: order.number }) : t('shop.orders.detail.title')}
        icon={ShoppingCart}
        breadcrumbs={[{ label: t('nav.orders'), href: '/shop/orders' }, { label: order?.number ?? '…' }]}
        secondaryActions={[
          {
            label: t('common.back'),
            href: '/shop/orders',
            icon: <ArrowLeft className="rtl:-scale-x-100" />,
            permission: undefined,
          },
        ]}
      />

      {loading || !order ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <>
          <Panel
            icon={ShoppingCart}
            title={t('shop.orders.detail.heading', { number: order.number })}
            description={format(new Date(order.created_at), 'PPpp', {
              locale: DATE_LOCALES[locale],
            })}
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={STATUS_KIND[order.status]} label={t(`shop.orders.status.${order.status}`)} />
                <Select value={order.status} onValueChange={(value) => changeStatus(value as OrderStatus)}>
                  <SelectTrigger className="w-44" disabled={statusMutation.isPending}>
                    <SelectValue placeholder={t('shop.orders.detail.change_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`shop.orders.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('shop.orders.detail.item')}</TableHead>
                      <TableHead className="text-end">{t('shop.orders.detail.qty')}</TableHead>
                      <TableHead className="text-end">{t('shop.orders.detail.price')}</TableHead>
                      <TableHead className="text-end">{t('shop.orders.detail.subtotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.sku}</div>
                        </TableCell>
                        <TableCell className="text-end tabular-nums">{item.qty}</TableCell>
                        <TableCell className="text-end tabular-nums">
                          {formatMoney(item.price, order.currency, locale)}
                        </TableCell>
                        <TableCell className="text-end tabular-nums">
                          {formatMoney(item.price * item.qty, order.currency, locale)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <dl className="space-y-2 self-start rounded-xl border border-[var(--glass-border)] p-4 text-sm">
                <TotalRow
                  label={t('shop.orders.detail.subtotal')}
                  value={formatMoney(order.totals.subtotal, order.currency, locale)}
                />
                <TotalRow
                  label={t('shop.orders.detail.shipping')}
                  value={formatMoney(order.totals.shipping, order.currency, locale)}
                />
                {order.totals.discount > 0 ? (
                  <TotalRow
                    label={t('shop.orders.detail.discount')}
                    value={`− ${formatMoney(order.totals.discount, order.currency, locale)}`}
                  />
                ) : null}
                <TotalRow
                  label={t('shop.orders.detail.tax')}
                  value={formatMoney(order.totals.tax, order.currency, locale)}
                />
                <div className="mt-2 flex items-center justify-between border-t pt-2 text-base font-semibold">
                  <span>{t('shop.orders.detail.total')}</span>
                  <span className="tabular-nums">{formatMoney(order.totals.total, order.currency, locale)}</span>
                </div>
              </dl>
            </div>
          </Panel>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Panel title={t('shop.orders.detail.parties')}>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
                <Party
                  icon={MapPin}
                  title={t('shop.orders.detail.customer')}
                  name={order.customer.name}
                  lines={`${order.customer.email ?? ''}\n${order.customer.address}`}
                />
                <Party
                  icon={Truck}
                  title={t('shop.orders.detail.shipping')}
                  name={order.shipping_method}
                  lines={order.shipping.address}
                />
                <Party
                  icon={CreditCard}
                  title={t('shop.orders.detail.billing')}
                  name={order.payment_method}
                  lines={order.billing.address}
                />
              </div>
            </Panel>

            <Panel title={t('shop.orders.detail.timeline')} className="md:col-span-1 xl:col-span-2">
              <ol className="space-y-4">
                {order.timeline.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Package className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{event.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.at), 'PPp', {
                          locale: DATE_LOCALES[locale],
                        })}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(next) => !next && setPending(null)}
        title={pending ? t(`shop.orders.detail.confirm.${pending}_title`) : ''}
        description={t('shop.orders.detail.confirm.description')}
        confirmLabel={pending ? t(`shop.orders.status.${pending}`) : undefined}
        destructive
        onConfirm={() => {
          if (pending) statusMutation.mutate(pending)
          setPending(null)
        }}
      />
    </div>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  )
}
