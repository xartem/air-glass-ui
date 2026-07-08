import { ApiError, ValidationError } from '../client'
import type {
  OrderDetail,
  OrderFilters,
  OrderLineItem,
  OrderListItem,
  OrderStatus,
  OrderTimelineEvent,
  Paginated,
  Product,
  ProductFilters,
  ProductListItem,
  ProductPayload,
  ProductStatus,
} from '../types'

/*
 * In-memory mock of the demo commerce module (orders, products catalog).
 * Shapes mirror the API DTOs (../types) exactly, so a real store backend can
 * replace this layer without touching a screen. Datasets persist in
 * localStorage so edits survive reloads, matching the users mock convention.
 * Amounts are major units + an ISO currency code (see src/lib/money.ts).
 */

const CURRENCY = 'USD'
const ORDERS_PER_PAGE = 12
const PRODUCTS_PER_PAGE = 12

/* ---- orders ---- */

const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const PAYMENT_STATES = ['paid', 'unpaid', 'partial', 'refunded'] as const
const CUSTOMER_NAMES = [
  'Ольга Петрова',
  'Dmitry Sokolov',
  'María García',
  'James Wilson',
  'Sophie Martin',
  'Luca Rossi',
  'Anna Nowak',
  'Іван Коваленко',
  'Emma Johnson',
  'Noah Schmidt',
  'Chloé Dubois',
  'Marco Bianchi',
  'Piotr Lewandowski',
  'Олена Шевченко',
  'Liam Brown',
  'Hannah Müller',
  'Camille Bernard',
  'Giulia Conti',
  'Katarzyna Wójcik',
  'Ava Davis',
]
const SHIPPING_METHODS = ['Standard', 'Express', 'Pickup', 'Freight']
const PAYMENT_METHODS = ['Visa •• 4242', 'PayPal', 'Bank transfer', 'Mastercard •• 5100']
const PRODUCT_NAMES = [
  'Aurora Desk Lamp',
  'Nimbus Wireless Headphones',
  'Terra Ceramic Mug',
  'Vega Mechanical Keyboard',
  'Lumen Smart Bulb',
  'Coral Yoga Mat',
  'Slate Notebook A5',
  'Drift Bluetooth Speaker',
  'Pulse Fitness Band',
  'Ember Scented Candle',
  'Onyx Water Bottle',
  'Willow Cotton Throw',
  'Halo Ring Light',
  'Cobalt Travel Backpack',
  'Fern Desk Planter',
  'Zephyr USB-C Hub',
  'Ivory Linen Shirt',
  'Basalt Cast Pan',
  'Aster Wall Clock',
  'Meridian Sunglasses',
]

let ordersCache: OrderDetail[] | null = null
const ORDERS_KEY = 'mock.shop.orders'

function money(base: number): number {
  return Math.round(base * 100) / 100
}

function buildOrders(): OrderDetail[] {
  const orders: OrderDetail[] = []
  const base = Date.now() - 2 * 24 * 3600 * 1000
  for (let i = 0; i < 46; i++) {
    const status = ORDER_STATUSES[i % ORDER_STATUSES.length]
    const paymentStatus = PAYMENT_STATES[i % PAYMENT_STATES.length]
    const customerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length]
    const itemsCount = 1 + (i % 4)
    const items: OrderLineItem[] = Array.from({ length: itemsCount }, (_, j) => {
      const price = money(9.99 + ((i * 7 + j * 13) % 40) * 4.5)
      return {
        id: j + 1,
        name: PRODUCT_NAMES[(i + j) % PRODUCT_NAMES.length],
        sku: `SKU-${1000 + ((i * 5 + j) % 900)}`,
        qty: 1 + ((i + j) % 3),
        price,
      }
    })
    const subtotal = money(items.reduce((sum, item) => sum + item.price * item.qty, 0))
    const shipping = status === 'delivered' || status === 'shipped' ? money(6.5) : money(9.9)
    const discount = i % 5 === 0 ? money(subtotal * 0.1) : 0
    const tax = money((subtotal - discount) * 0.08)
    const total = money(subtotal + shipping - discount + tax)
    const createdAt = new Date(base - i * 5 * 3600 * 1000).toISOString()
    const timeline: OrderTimelineEvent[] = [{ id: 1, at: createdAt, kind: 'created', label: 'Order placed' }]
    if (status !== 'pending' && status !== 'cancelled') {
      timeline.push({
        id: 2,
        at: new Date(base - i * 5 * 3600 * 1000 + 2 * 3600 * 1000).toISOString(),
        kind: 'processing',
        label: 'Payment captured',
      })
    }
    if (status === 'shipped' || status === 'delivered') {
      timeline.push({
        id: 3,
        at: new Date(base - i * 5 * 3600 * 1000 + 8 * 3600 * 1000).toISOString(),
        kind: 'shipped',
        label: 'Shipped',
      })
    }
    if (status === 'delivered') {
      timeline.push({
        id: 4,
        at: new Date(base - i * 5 * 3600 * 1000 + 30 * 3600 * 1000).toISOString(),
        kind: 'delivered',
        label: 'Delivered',
      })
    }
    const address = `${100 + i} Market St\nSuite ${1 + (i % 40)}\nPortland, OR 972${(10 + (i % 80)).toString().padStart(2, '0')}`
    orders.push({
      id: 1000 + i,
      number: `#${10500 - i}`,
      customer_name: customerName,
      created_at: createdAt,
      status,
      payment_status: paymentStatus,
      total,
      currency: CURRENCY,
      items_count: itemsCount,
      customer: {
        name: customerName,
        email: `${customerName.split(' ')[0].toLowerCase()}@example.com`,
        phone: '+1 555 0100',
        address,
      },
      shipping: { name: customerName, address },
      billing: { name: customerName, address },
      items,
      totals: { subtotal, shipping, discount, tax, total },
      timeline,
      shipping_method: SHIPPING_METHODS[i % SHIPPING_METHODS.length],
      payment_method: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
    })
  }
  return orders
}

function ordersStore(): OrderDetail[] {
  if (ordersCache) return ordersCache
  const raw = localStorage.getItem(ORDERS_KEY)
  ordersCache = raw ? (JSON.parse(raw) as OrderDetail[]) : buildOrders()
  persistOrders()
  return ordersCache
}

function persistOrders(): void {
  if (ordersCache) localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersCache))
}

function toOrderListItem(order: OrderDetail): OrderListItem {
  return {
    id: order.id,
    number: order.number,
    customer_name: order.customer_name,
    created_at: order.created_at,
    status: order.status,
    payment_status: order.payment_status,
    total: order.total,
    currency: order.currency,
    items_count: order.items_count,
  }
}

export function listOrders(filters: OrderFilters): Paginated<OrderListItem> {
  let rows = ordersStore().slice()
  const q = filters.q?.toLowerCase().trim()
  if (q) rows = rows.filter((o) => o.number.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q))
  if (filters.status) rows = rows.filter((o) => o.status === filters.status)
  if (filters.from) rows = rows.filter((o) => o.created_at >= String(filters.from))
  if (filters.to) rows = rows.filter((o) => o.created_at <= `${filters.to}T23:59:59Z`)
  const sort = filters.sort ?? 'created_at'
  const dir = filters.dir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    if (sort === 'total') return (a.total - b.total) * dir
    if (sort === 'number') return a.number.localeCompare(b.number) * dir
    return a.created_at.localeCompare(b.created_at) * dir
  })
  const page = Math.max(1, filters.page ?? 1)
  return {
    rows: rows.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE).map(toOrderListItem),
    total: rows.length,
    page,
    per_page: ORDERS_PER_PAGE,
  }
}

export function getOrder(id: number): OrderDetail {
  const order = ordersStore().find((o) => o.id === id)
  if (!order) throw new ApiError(404, 'Order not found')
  return structuredClone(order)
}

/** Move an order to a new status; appends a timeline event (mock write). */
export function setOrderStatus(id: number, status: OrderStatus): OrderDetail {
  const order = ordersStore().find((o) => o.id === id)
  if (!order) throw new ApiError(404, 'Order not found')
  order.status = status
  if (status === 'refunded') order.payment_status = 'refunded'
  order.timeline.push({
    id: (order.timeline.at(-1)?.id ?? 0) + 1,
    at: new Date().toISOString(),
    kind: status,
    label: `Status changed to ${status}`,
  })
  persistOrders()
  return structuredClone(order)
}

/* ---- products catalog ---- */

const PRODUCT_STATUSES: ProductStatus[] = ['active', 'active', 'active', 'draft', 'archived']
const PRODUCT_CATEGORIES = ['Lighting', 'Audio', 'Home', 'Accessories', 'Fitness', 'Stationery']
const PRODUCT_SWATCHES = ['#bfdbfe', '#bbf7d0', '#fde68a', '#fecaca', '#ddd6fe', '#a5f3fc']

let productsCache: Product[] | null = null
const PRODUCTS_KEY = 'mock.shop.products'

function productThumb(index: number): string {
  const color = PRODUCT_SWATCHES[index % PRODUCT_SWATCHES.length]
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="12" fill="${color}"/></svg>`,
  )}`
}

function buildProducts(): Product[] {
  return PRODUCT_NAMES.map((name, index) => {
    const price = money(14.99 + (index % 12) * 7.5)
    const status = PRODUCT_STATUSES[index % PRODUCT_STATUSES.length]
    return {
      id: 500 + index,
      name,
      sku: `SKU-${1000 + index}`,
      price,
      currency: CURRENCY,
      stock: status === 'archived' ? 0 : (index * 13) % 140,
      status,
      image: productThumb(index),
      description: `${name} — a demo catalog item used to showcase the products screen.`,
      category: PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length],
      cost: money(price * 0.6),
      compare_at_price: index % 3 === 0 ? money(price * 1.25) : null,
      weight: money(0.2 + (index % 5) * 0.3),
    }
  })
}

function productsStore(): Product[] {
  if (productsCache) return productsCache
  const raw = localStorage.getItem(PRODUCTS_KEY)
  productsCache = raw ? (JSON.parse(raw) as Product[]) : buildProducts()
  persistProducts()
  return productsCache
}

function persistProducts(): void {
  if (productsCache) localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache))
}

function toProductListItem(product: Product): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
    status: product.status,
    image: product.image,
  }
}

export function listProducts(filters: ProductFilters): Paginated<ProductListItem> {
  let rows = productsStore().slice()
  const q = filters.q?.toLowerCase().trim()
  if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  if (filters.status) rows = rows.filter((p) => p.status === filters.status)
  const sort = filters.sort ?? 'name'
  const dir = filters.dir === 'desc' ? -1 : 1
  rows.sort((a, b) => {
    if (sort === 'price') return (a.price - b.price) * dir
    if (sort === 'stock') return (a.stock - b.stock) * dir
    return a.name.localeCompare(b.name) * dir
  })
  const page = Math.max(1, filters.page ?? 1)
  return {
    rows: rows.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE).map(toProductListItem),
    total: rows.length,
    page,
    per_page: PRODUCTS_PER_PAGE,
  }
}

export function getProduct(id: number): Product {
  const product = productsStore().find((p) => p.id === id)
  if (!product) throw new ApiError(404, 'Product not found')
  return structuredClone(product)
}

/** Create (id absent) or update a product from the editor form. */
export function saveProduct(payload: ProductPayload, id?: number): Product {
  if (!payload.name?.trim()) throw new ValidationError('Validation failed', { name: 'required' })
  if (!payload.sku?.trim()) throw new ValidationError('Validation failed', { sku: 'required' })
  const store = productsStore()
  if (id) {
    const product = store.find((p) => p.id === id)
    if (!product) throw new ApiError(404, 'Product not found')
    Object.assign(product, payload, { image: payload.image ?? product.image })
    persistProducts()
    return structuredClone(product)
  }
  const nextId = Math.max(0, ...store.map((p) => p.id)) + 1
  const created: Product = {
    id: nextId,
    currency: CURRENCY,
    ...payload,
    image: payload.image,
  }
  store.unshift(created)
  persistProducts()
  return structuredClone(created)
}
