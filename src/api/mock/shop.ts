import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  Cart,
  CartItem,
  CheckoutAddress,
  CustomerDetail,
  CustomerFilters,
  CustomerListItem,
  CustomerStatus,
  DeliveryMethod,
  DeliveryPayload,
  Discount,
  DiscountPayload,
  DiscountStatus,
  DiscountType,
  InvoiceDetail,
  InvoiceDraft,
  InvoiceFilters,
  InvoiceListItem,
  InvoiceStatus,
  OrderDetail,
  OrderFilters,
  OrderLineItem,
  OrderListItem,
  OrderStatus,
  OrderTimelineEvent,
  Paginated,
  Payment,
  PaymentFilters,
  PaymentMethod,
  PaymentStats,
  PaymentTxnStatus,
  PlaceOrderPayload,
  Product,
  ProductFilters,
  ProductListItem,
  ProductPayload,
  ProductReview,
  ProductStatus,
  SellerDetail,
  SellerFilters,
  SellerListItem,
  SellerStatus,
  ShippingMethod,
} from "../types";

/*
 * In-memory mock of the demo commerce module (orders, products catalog).
 * Shapes mirror the API DTOs (../types) exactly, so a real store backend can
 * replace this layer without touching a screen. Datasets persist in
 * localStorage so edits survive reloads, matching the users mock convention.
 * Amounts are major units + an ISO currency code (see src/lib/money.ts).
 */

const CURRENCY = "USD";
const ORDERS_PER_PAGE = 12;
const PRODUCTS_PER_PAGE = 12;

/* ---- orders ---- */

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
];
const PAYMENT_STATES = ["paid", "unpaid", "partial", "refunded"] as const;
const CUSTOMER_NAMES = [
  "Olga Petrova",
  "Dmitry Sokolov",
  "María García",
  "James Wilson",
  "Sophie Martin",
  "Luca Rossi",
  "Anna Nowak",
  "Ivan Kovalenko",
  "Emma Johnson",
  "Noah Schmidt",
  "Chloé Dubois",
  "Marco Bianchi",
  "Piotr Lewandowski",
  "Olena Shevchenko",
  "Liam Brown",
  "Hannah Müller",
  "Camille Bernard",
  "Giulia Conti",
  "Katarzyna Wójcik",
  "Ava Davis",
];
const SHIPPING_METHODS = ["Standard", "Express", "Pickup", "Freight"];
const PAYMENT_METHODS = [
  "Visa •• 4242",
  "PayPal",
  "Bank transfer",
  "Mastercard •• 5100",
];
const PRODUCT_NAMES = [
  "Aurora Desk Lamp",
  "Nimbus Wireless Headphones",
  "Terra Ceramic Mug",
  "Vega Mechanical Keyboard",
  "Lumen Smart Bulb",
  "Coral Yoga Mat",
  "Slate Notebook A5",
  "Drift Bluetooth Speaker",
  "Pulse Fitness Band",
  "Ember Scented Candle",
  "Onyx Water Bottle",
  "Willow Cotton Throw",
  "Halo Ring Light",
  "Cobalt Travel Backpack",
  "Fern Desk Planter",
  "Zephyr USB-C Hub",
  "Ivory Linen Shirt",
  "Basalt Cast Pan",
  "Aster Wall Clock",
  "Meridian Sunglasses",
];

let ordersCache: OrderDetail[] | null = null;
const ORDERS_KEY = "mock.shop.orders";

function money(base: number): number {
  return Math.round(base * 100) / 100;
}

function buildOrders(): OrderDetail[] {
  const orders: OrderDetail[] = [];
  const base = Date.now() - 2 * 24 * 3600 * 1000;
  for (let i = 0; i < 46; i++) {
    const status = ORDER_STATUSES[i % ORDER_STATUSES.length];
    const paymentStatus = PAYMENT_STATES[i % PAYMENT_STATES.length];
    const customerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const itemsCount = 1 + (i % 4);
    const items: OrderLineItem[] = Array.from(
      { length: itemsCount },
      (_, j) => {
        const price = money(9.99 + ((i * 7 + j * 13) % 40) * 4.5);
        return {
          id: j + 1,
          name: PRODUCT_NAMES[(i + j) % PRODUCT_NAMES.length],
          sku: `SKU-${1000 + ((i * 5 + j) % 900)}`,
          qty: 1 + ((i + j) % 3),
          price,
        };
      },
    );
    const subtotal = money(
      items.reduce((sum, item) => sum + item.price * item.qty, 0),
    );
    const shipping =
      status === "delivered" || status === "shipped" ? money(6.5) : money(9.9);
    const discount = i % 5 === 0 ? money(subtotal * 0.1) : 0;
    const tax = money((subtotal - discount) * 0.08);
    const total = money(subtotal + shipping - discount + tax);
    const createdAt = new Date(base - i * 5 * 3600 * 1000).toISOString();
    const timeline: OrderTimelineEvent[] = [
      { id: 1, at: createdAt, kind: "created", label: "Order placed" },
    ];
    if (status !== "pending" && status !== "cancelled") {
      timeline.push({
        id: 2,
        at: new Date(
          base - i * 5 * 3600 * 1000 + 2 * 3600 * 1000,
        ).toISOString(),
        kind: "processing",
        label: "Payment captured",
      });
    }
    if (status === "shipped" || status === "delivered") {
      timeline.push({
        id: 3,
        at: new Date(
          base - i * 5 * 3600 * 1000 + 8 * 3600 * 1000,
        ).toISOString(),
        kind: "shipped",
        label: "Shipped",
      });
    }
    if (status === "delivered") {
      timeline.push({
        id: 4,
        at: new Date(
          base - i * 5 * 3600 * 1000 + 30 * 3600 * 1000,
        ).toISOString(),
        kind: "delivered",
        label: "Delivered",
      });
    }
    const address = `${100 + i} Market St\nSuite ${1 + (i % 40)}\nPortland, OR 972${(10 + (i % 80)).toString().padStart(2, "0")}`;
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
        email: `${customerName.split(" ")[0].toLowerCase()}@example.com`,
        phone: "+1 555 0100",
        address,
      },
      shipping: { name: customerName, address },
      billing: { name: customerName, address },
      items,
      totals: { subtotal, shipping, discount, tax, total },
      timeline,
      shipping_method: SHIPPING_METHODS[i % SHIPPING_METHODS.length],
      payment_method: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
    });
  }
  return orders;
}

function ordersStore(): OrderDetail[] {
  if (ordersCache) return ordersCache;
  const raw = localStorage.getItem(ORDERS_KEY);
  ordersCache = raw ? (JSON.parse(raw) as OrderDetail[]) : buildOrders();
  persistOrders();
  return ordersCache;
}

function persistOrders(): void {
  if (ordersCache)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersCache));
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
  };
}

export function listOrders(filters: OrderFilters): Paginated<OrderListItem> {
  let rows = ordersStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (o) =>
        o.number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q),
    );
  if (filters.status) rows = rows.filter((o) => o.status === filters.status);
  if (filters.from)
    rows = rows.filter((o) => o.created_at >= String(filters.from));
  if (filters.to)
    rows = rows.filter((o) => o.created_at <= `${filters.to}T23:59:59Z`);
  const sort = filters.sort ?? "created_at";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sort === "total") return (a.total - b.total) * dir;
    if (sort === "number") return a.number.localeCompare(b.number) * dir;
    return a.created_at.localeCompare(b.created_at) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows
      .slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE)
      .map(toOrderListItem),
    total: rows.length,
    page,
    per_page: ORDERS_PER_PAGE,
  };
}

export function getOrder(id: number): OrderDetail {
  const order = ordersStore().find((o) => o.id === id);
  if (!order) throw new ApiError(404, "Order not found");
  return structuredClone(order);
}

/** Move an order to a new status; appends a timeline event (mock write). */
export function setOrderStatus(id: number, status: OrderStatus): OrderDetail {
  const order = ordersStore().find((o) => o.id === id);
  if (!order) throw new ApiError(404, "Order not found");
  order.status = status;
  if (status === "refunded") order.payment_status = "refunded";
  order.timeline.push({
    id: (order.timeline.at(-1)?.id ?? 0) + 1,
    at: new Date().toISOString(),
    kind: status,
    label: `Status changed to ${status}`,
  });
  persistOrders();
  return structuredClone(order);
}

/* ---- products catalog ---- */

const PRODUCT_STATUSES: ProductStatus[] = [
  "active",
  "active",
  "active",
  "draft",
  "archived",
];
const PRODUCT_CATEGORIES = [
  "Lighting",
  "Audio",
  "Home",
  "Accessories",
  "Fitness",
  "Stationery",
];
const PRODUCT_SWATCHES = [
  "#bfdbfe",
  "#bbf7d0",
  "#fde68a",
  "#fecaca",
  "#ddd6fe",
  "#a5f3fc",
];

let productsCache: Product[] | null = null;
const PRODUCTS_KEY = "mock.shop.products";

function productThumb(index: number): string {
  const color = PRODUCT_SWATCHES[index % PRODUCT_SWATCHES.length];
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="12" fill="${color}"/></svg>`,
  )}`;
}

function buildProducts(): Product[] {
  return PRODUCT_NAMES.map((name, index) => {
    const price = money(14.99 + (index % 12) * 7.5);
    const status = PRODUCT_STATUSES[index % PRODUCT_STATUSES.length];
    return {
      id: 500 + index,
      name,
      sku: `SKU-${1000 + index}`,
      price,
      currency: CURRENCY,
      stock: status === "archived" ? 0 : (index * 13) % 140,
      status,
      image: productThumb(index),
      description: `${name} — a demo catalog item used to showcase the products screen.`,
      category: PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length],
      cost: money(price * 0.6),
      compare_at_price: index % 3 === 0 ? money(price * 1.25) : null,
      weight: money(0.2 + (index % 5) * 0.3),
    };
  });
}

function productsStore(): Product[] {
  if (productsCache) return productsCache;
  const raw = localStorage.getItem(PRODUCTS_KEY);
  productsCache = raw ? (JSON.parse(raw) as Product[]) : buildProducts();
  persistProducts();
  return productsCache;
}

function persistProducts(): void {
  if (productsCache)
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(productsCache));
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
  };
}

export function listProducts(
  filters: ProductFilters,
): Paginated<ProductListItem> {
  let rows = productsStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
    );
  if (filters.status) rows = rows.filter((p) => p.status === filters.status);
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "price") return (a.price - b.price) * dir;
    if (sort === "stock") return (a.stock - b.stock) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows
      .slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE)
      .map(toProductListItem),
    total: rows.length,
    page,
    per_page: PRODUCTS_PER_PAGE,
  };
}

export function getProduct(id: number): Product {
  const product = productsStore().find((p) => p.id === id);
  if (!product) throw new ApiError(404, "Product not found");
  return structuredClone(product);
}

/** Create (id absent) or update a product from the editor form. */
export function saveProduct(payload: ProductPayload, id?: number): Product {
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  if (!payload.sku?.trim())
    throw new ValidationError("Validation failed", { sku: "required" });
  const store = productsStore();
  if (id) {
    const product = store.find((p) => p.id === id);
    if (!product) throw new ApiError(404, "Product not found");
    Object.assign(product, payload, { image: payload.image ?? product.image });
    persistProducts();
    return structuredClone(product);
  }
  const nextId = Math.max(0, ...store.map((p) => p.id)) + 1;
  const created: Product = {
    id: nextId,
    currency: CURRENCY,
    ...payload,
    image: payload.image,
  };
  store.unshift(created);
  persistProducts();
  return structuredClone(created);
}

/* ---- customers (CRM) ---- */

const CUSTOMER_STATUSES: CustomerStatus[] = [
  "active",
  "active",
  "vip",
  "active",
  "blocked",
];
const CUSTOMERS_PER_PAGE = 12;

let customersCache: CustomerDetail[] | null = null;

function buildCustomers(): CustomerDetail[] {
  const base = Date.now();
  return CUSTOMER_NAMES.map((name, index) => {
    const ordersCount = (index * 3) % 24;
    const ltv = money(120 + ((index * 37) % 60) * 45);
    const aov = ordersCount > 0 ? money(ltv / ordersCount) : 0;
    const first = name.split(" ")[0].toLowerCase();
    return {
      id: 700 + index,
      name,
      email: `${first}@example.com`,
      orders_count: ordersCount,
      ltv,
      currency: CURRENCY,
      status: CUSTOMER_STATUSES[index % CUSTOMER_STATUSES.length],
      joined_at: new Date(
        base - (index + 1) * 9 * 24 * 3600 * 1000,
      ).toISOString(),
      phone: `+1 555 0${(100 + index).toString().slice(-3)}`,
      address: `${100 + index} Market St\nPortland, OR 972${(10 + (index % 80)).toString().padStart(2, "0")}`,
      aov,
      recent_orders: [],
      notes: [
        {
          id: 1,
          at: new Date(base - (index + 1) * 3 * 24 * 3600 * 1000).toISOString(),
          author: "Support",
          text: "Reached out about a shipping question — resolved.",
        },
      ],
    };
  });
}

function customersStore(): CustomerDetail[] {
  customersCache ??= buildCustomers();
  return customersCache;
}

function toCustomerListItem(customer: CustomerDetail): CustomerListItem {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    orders_count: customer.orders_count,
    ltv: customer.ltv,
    currency: customer.currency,
    status: customer.status,
    joined_at: customer.joined_at,
  };
}

export function listCustomers(
  filters: CustomerFilters,
): Paginated<CustomerListItem> {
  let rows = customersStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q),
    );
  if (filters.status) rows = rows.filter((c) => c.status === filters.status);
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "orders_count") return (a.orders_count - b.orders_count) * dir;
    if (sort === "ltv") return (a.ltv - b.ltv) * dir;
    if (sort === "joined_at")
      return a.joined_at.localeCompare(b.joined_at) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows
      .slice((page - 1) * CUSTOMERS_PER_PAGE, page * CUSTOMERS_PER_PAGE)
      .map(toCustomerListItem),
    total: rows.length,
    page,
    per_page: CUSTOMERS_PER_PAGE,
  };
}

export function getCustomer(id: number): CustomerDetail {
  const customer = customersStore().find((c) => c.id === id);
  if (!customer) throw new ApiError(404, "Customer not found");
  // Recent orders: a slice of the shared orders fixture, relabelled to this customer.
  const recent = ordersStore()
    .slice(0, 3)
    .map((order) => ({
      ...toOrderListItem(order),
      customer_name: customer.name,
    }));
  return { ...structuredClone(customer), recent_orders: recent };
}

/* ---- payments ---- */

const PAYMENT_METHODS_ENUM: PaymentMethod[] = [
  "card",
  "paypal",
  "transfer",
  "cash",
];
const PAYMENT_TXN_STATUSES: PaymentTxnStatus[] = [
  "captured",
  "captured",
  "pending",
  "refunded",
  "failed",
];
const PAYMENTS_PER_PAGE = 12;

let paymentsCache: Payment[] | null = null;

function buildPayments(): Payment[] {
  const base = Date.now() - 3600 * 1000;
  return Array.from({ length: 42 }, (_, index) => {
    const status = PAYMENT_TXN_STATUSES[index % PAYMENT_TXN_STATUSES.length];
    return {
      id: 900 + index,
      txn: `txn_${(1000000 + index * 7).toString(36)}`,
      order_number: `#${10500 - (index % 46)}`,
      customer_name: CUSTOMER_NAMES[index % CUSTOMER_NAMES.length],
      method: PAYMENT_METHODS_ENUM[index % PAYMENT_METHODS_ENUM.length],
      amount: money(19.99 + ((index * 11) % 50) * 6.4),
      currency: CURRENCY,
      status,
      created_at: new Date(base - index * 3 * 3600 * 1000).toISOString(),
    };
  });
}

function paymentsStore(): Payment[] {
  paymentsCache ??= buildPayments();
  return paymentsCache;
}

export function paymentStats(): PaymentStats {
  const rows = paymentsStore();
  const sum = (predicate: (p: Payment) => boolean) =>
    money(rows.filter(predicate).reduce((total, p) => total + p.amount, 0));
  return {
    captured: sum((p) => p.status === "captured"),
    refunded: sum((p) => p.status === "refunded"),
    pending: sum((p) => p.status === "pending"),
    currency: CURRENCY,
  };
}

export function listPayments(filters: PaymentFilters): Paginated<Payment> {
  let rows = paymentsStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (p) =>
        p.txn.toLowerCase().includes(q) ||
        p.order_number.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q),
    );
  if (filters.status) rows = rows.filter((p) => p.status === filters.status);
  if (filters.method) rows = rows.filter((p) => p.method === filters.method);
  if (filters.from)
    rows = rows.filter((p) => p.created_at >= String(filters.from));
  if (filters.to)
    rows = rows.filter((p) => p.created_at <= `${filters.to}T23:59:59Z`);
  const sort = filters.sort ?? "created_at";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) =>
    sort === "amount"
      ? (a.amount - b.amount) * dir
      : a.created_at.localeCompare(b.created_at) * dir,
  );
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PAYMENTS_PER_PAGE, page * PAYMENTS_PER_PAGE),
    total: rows.length,
    page,
    per_page: PAYMENTS_PER_PAGE,
  };
}

/** Refund a captured payment (mock write). */
export function refundPayment(id: number): Payment {
  const payment = paymentsStore().find((p) => p.id === id);
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.status !== "captured")
    throw new ValidationError("Validation failed", {
      _error: "not_refundable",
    });
  payment.status = "refunded";
  return structuredClone(payment);
}

/* ---- invoices ---- */

const INVOICE_STATUSES: InvoiceStatus[] = ["paid", "sent", "overdue", "draft"];
const INVOICES_PER_PAGE = 12;

let invoicesCache: InvoiceDetail[] | null = null;

function buildInvoices(): InvoiceDetail[] {
  const base = Date.now();
  return Array.from({ length: 26 }, (_, index) => {
    const customerName = CUSTOMER_NAMES[index % CUSTOMER_NAMES.length];
    const items: OrderLineItem[] = Array.from(
      { length: 1 + (index % 3) },
      (_, j) => ({
        id: j + 1,
        name: PRODUCT_NAMES[(index + j) % PRODUCT_NAMES.length],
        sku: `SKU-${1000 + ((index * 3 + j) % 900)}`,
        qty: 1 + ((index + j) % 4),
        price: money(29.99 + ((index * 5 + j) % 30) * 8),
      }),
    );
    const subtotal = money(
      items.reduce((sum, item) => sum + item.price * item.qty, 0),
    );
    const tax = money(subtotal * 0.08);
    const total = money(subtotal + tax);
    const issuedAt = new Date(
      base - (index + 1) * 6 * 24 * 3600 * 1000,
    ).toISOString();
    return {
      id: 800 + index,
      number: `INV-2026-${(1000 + index).toString()}`,
      customer_name: customerName,
      issued_at: issuedAt,
      due_at: new Date(
        base - (index + 1) * 6 * 24 * 3600 * 1000 + 14 * 24 * 3600 * 1000,
      ).toISOString(),
      amount: total,
      currency: CURRENCY,
      status: INVOICE_STATUSES[index % INVOICE_STATUSES.length],
      issuer: {
        name: "Air Glass Store, Inc.",
        email: "billing@airglass.example",
        address: "1 Glassway Ave\nSan Francisco, CA 94107",
      },
      recipient: {
        name: customerName,
        email: `${customerName.split(" ")[0].toLowerCase()}@example.com`,
        address: `${100 + index} Market St\nPortland, OR 972${(10 + (index % 80)).toString().padStart(2, "0")}`,
      },
      items,
      totals: { subtotal, shipping: 0, discount: 0, tax, total },
      notes: "Payment due within 14 days. Thank you for your business.",
    };
  });
}

function invoicesStore(): InvoiceDetail[] {
  invoicesCache ??= buildInvoices();
  return invoicesCache;
}

function toInvoiceListItem(invoice: InvoiceDetail): InvoiceListItem {
  return {
    id: invoice.id,
    number: invoice.number,
    customer_name: invoice.customer_name,
    issued_at: invoice.issued_at,
    due_at: invoice.due_at,
    amount: invoice.amount,
    currency: invoice.currency,
    status: invoice.status,
  };
}

export function listInvoices(
  filters: InvoiceFilters,
): Paginated<InvoiceListItem> {
  let rows = invoicesStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (inv) =>
        inv.number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q),
    );
  if (filters.status)
    rows = rows.filter((inv) => inv.status === filters.status);
  const sort = filters.sort ?? "issued_at";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sort === "amount") return (a.amount - b.amount) * dir;
    if (sort === "number") return a.number.localeCompare(b.number) * dir;
    return a.issued_at.localeCompare(b.issued_at) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows
      .slice((page - 1) * INVOICES_PER_PAGE, page * INVOICES_PER_PAGE)
      .map(toInvoiceListItem),
    total: rows.length,
    page,
    per_page: INVOICES_PER_PAGE,
  };
}

export function getInvoice(id: number): InvoiceDetail {
  const invoice = invoicesStore().find((inv) => inv.id === id);
  if (!invoice) throw new ApiError(404, "Invoice not found");
  return structuredClone(invoice);
}

/* ---- discounts (CRUD) ---- */

const DISCOUNT_TYPES: DiscountType[] = ["percent", "fixed"];
const DISCOUNT_STATUSES: DiscountStatus[] = [
  "active",
  "scheduled",
  "expired",
  "disabled",
];
const DISCOUNT_CODES = [
  "WELCOME10",
  "SUMMER25",
  "FREESHIP",
  "VIP15",
  "BLACKFRIDAY",
  "SPRING20",
  "LOYALTY5",
  "FLASH50",
  "NEWYEAR30",
  "STUDENT12",
];

let discountsCache: Discount[] | null = null;

function buildDiscounts(): Discount[] {
  const base = Date.now();
  return DISCOUNT_CODES.map((code, index) => {
    const type = DISCOUNT_TYPES[index % DISCOUNT_TYPES.length]!;
    return {
      id: 300 + index,
      code,
      type,
      value:
        type === "percent"
          ? 5 + ((index * 5) % 45)
          : money(5 + (index % 10) * 4.5),
      currency: CURRENCY,
      used: (index * 17) % 240,
      usage_limit: index % 3 === 0 ? null : 100 + index * 25,
      status: DISCOUNT_STATUSES[index % DISCOUNT_STATUSES.length]!,
      expires_at:
        index % 4 === 0
          ? null
          : new Date(
              base + ((index % 6) + 1) * 7 * 24 * 3600 * 1000,
            ).toISOString(),
    };
  });
}

function discountsStore(): Discount[] {
  discountsCache ??= buildDiscounts();
  return discountsCache;
}

export function listDiscounts(): Discount[] {
  return structuredClone(discountsStore());
}

/** Create (id absent) or update a discount from the editor dialog. */
export function saveDiscount(payload: DiscountPayload, id?: number): Discount {
  if (!payload.code?.trim())
    throw new ValidationError("Validation failed", { code: "required" });
  if (!(payload.value >= 0))
    throw new ValidationError("Validation failed", { value: "invalid" });
  const store = discountsStore();
  if (id) {
    const discount = store.find((item) => item.id === id);
    if (!discount) throw new ApiError(404, "Discount not found");
    Object.assign(discount, payload, {
      code: payload.code.trim().toUpperCase(),
    });
    return structuredClone(discount);
  }
  const created: Discount = {
    id: Math.max(0, ...store.map((item) => item.id)) + 1,
    currency: CURRENCY,
    used: 0,
    ...payload,
    code: payload.code.trim().toUpperCase(),
  };
  store.unshift(created);
  return structuredClone(created);
}

export function deleteDiscount(id: number): { ok: true } {
  const store = discountsStore();
  const at = store.findIndex((item) => item.id === id);
  if (at < 0) throw new ApiError(404, "Discount not found");
  store.splice(at, 1);
  return { ok: true };
}

/* ---- delivery methods (CRUD) ---- */

const DELIVERY_SEED: Omit<DeliveryMethod, "id" | "currency">[] = [
  { name: "Standard", zone: "Domestic", rate: 4.9, eta_days: 5, active: true },
  { name: "Express", zone: "Domestic", rate: 12.5, eta_days: 2, active: true },
  { name: "Next Day", zone: "Domestic", rate: 24.0, eta_days: 1, active: true },
  { name: "Pickup", zone: "Local", rate: 0, eta_days: 0, active: true },
  {
    name: "EU Standard",
    zone: "Europe",
    rate: 14.9,
    eta_days: 7,
    active: true,
  },
  {
    name: "Worldwide",
    zone: "International",
    rate: 39.0,
    eta_days: 14,
    active: false,
  },
];

let deliveryCache: DeliveryMethod[] | null = null;

function buildDelivery(): DeliveryMethod[] {
  return DELIVERY_SEED.map((method, index) => ({
    id: 400 + index,
    currency: CURRENCY,
    ...method,
  }));
}

function deliveryStore(): DeliveryMethod[] {
  deliveryCache ??= buildDelivery();
  return deliveryCache;
}

export function listDelivery(): DeliveryMethod[] {
  return structuredClone(deliveryStore());
}

/** Create (id absent) or update a shipping method from the editor dialog. */
export function saveDelivery(
  payload: DeliveryPayload,
  id?: number,
): DeliveryMethod {
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  if (!payload.zone?.trim())
    throw new ValidationError("Validation failed", { zone: "required" });
  const store = deliveryStore();
  if (id) {
    const method = store.find((item) => item.id === id);
    if (!method) throw new ApiError(404, "Delivery method not found");
    Object.assign(method, payload);
    return structuredClone(method);
  }
  const created: DeliveryMethod = {
    id: Math.max(0, ...store.map((item) => item.id)) + 1,
    currency: CURRENCY,
    ...payload,
  };
  store.unshift(created);
  return structuredClone(created);
}

export function deleteDelivery(id: number): { ok: true } {
  const store = deliveryStore();
  const at = store.findIndex((item) => item.id === id);
  if (at < 0) throw new ApiError(404, "Delivery method not found");
  store.splice(at, 1);
  return { ok: true };
}

/* ---- product reviews (W3) ---- */

const REVIEW_AUTHORS = [
  "Olivia P.",
  "Marco B.",
  "Sophie M.",
  "James W.",
  "Anna N.",
  "Liam B.",
];
const REVIEW_TITLES = [
  "Exactly as described",
  "Great value",
  "Would buy again",
  "Solid quality",
  "A bit pricey",
  "Fast shipping",
];

export function listReviews(productId: number): ProductReview[] {
  devDebug("[mock:shop] listReviews", productId);
  const count = 3 + (productId % 4);
  const base = Date.now();
  return Array.from({ length: count }, (_, index) => ({
    id: productId * 100 + index,
    author: REVIEW_AUTHORS[(productId + index) % REVIEW_AUTHORS.length]!,
    rating: 3 + ((productId + index) % 3),
    title: REVIEW_TITLES[(productId + index) % REVIEW_TITLES.length]!,
    body: "A demo review used to showcase the product reviews tab. The item met expectations and arrived on time.",
    created_at: new Date(base - (index + 1) * 4 * 24 * 3600 * 1000).toISOString(),
  }));
}

/* ---- cart (W3) — persisted in the mock session ---- */

const CART_KEY = "mock.shop.cart";
const PROMO_CODES: Record<string, number> = {
  WELCOME10: 0.1,
  SUMMER25: 0.25,
  VIP15: 0.15,
};

let cartCache: CartItem[] | null = null;

function seedCartItems(): CartItem[] {
  const products = productsStore().filter((p) => p.status === "active").slice(0, 3);
  const variants = ["Default", "Large", null];
  return products.map((product, index) => ({
    id: index + 1,
    product_id: product.id,
    name: product.name,
    variant: variants[index % variants.length] ?? null,
    image: product.image,
    price: product.price,
    qty: 1 + (index % 2),
  }));
}

function cartItemsStore(): CartItem[] {
  if (cartCache) return cartCache;
  const raw = localStorage.getItem(CART_KEY);
  cartCache = raw ? (JSON.parse(raw) as CartItem[]) : seedCartItems();
  persistCart();
  return cartCache;
}

function persistCart(): void {
  if (cartCache) localStorage.setItem(CART_KEY, JSON.stringify(cartCache));
}

let cartPromo: string | null = null;

function buildCart(): Cart {
  const items = cartItemsStore();
  const subtotal = money(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const shipping = items.length > 0 ? money(6.5) : 0;
  const discountRate = cartPromo ? (PROMO_CODES[cartPromo] ?? 0) : 0;
  const discount = money(subtotal * discountRate);
  const tax = money((subtotal - discount) * 0.08);
  const total = money(Math.max(0, subtotal + shipping - discount + tax));
  return {
    items: structuredClone(items),
    currency: CURRENCY,
    promo: cartPromo,
    totals: { subtotal, shipping, discount, tax, total },
  };
}

export function getCart(): Cart {
  devDebug("[mock:shop] getCart");
  return buildCart();
}

export function updateCartItem(itemId: number, qty: number): Cart {
  devDebug("[mock:shop] updateCartItem", { itemId, qty });
  const items = cartItemsStore();
  const item = items.find((entry) => entry.id === itemId);
  if (!item) throw new ApiError(404, "Cart item not found");
  item.qty = Math.max(1, Math.round(qty));
  persistCart();
  return buildCart();
}

export function removeCartItem(itemId: number): Cart {
  devDebug("[mock:shop] removeCartItem", itemId);
  const items = cartItemsStore();
  const at = items.findIndex((entry) => entry.id === itemId);
  if (at >= 0) items.splice(at, 1);
  persistCart();
  return buildCart();
}

export function applyPromo(code: string): Cart {
  devDebug("[mock:shop] applyPromo", code);
  const normalized = code.trim().toUpperCase();
  if (!(normalized in PROMO_CODES))
    throw new ValidationError("Validation failed", { code: "invalid_promo" });
  cartPromo = normalized;
  return buildCart();
}

/* ---- shipping methods (W3) ---- */

export function shippingMethods(): ShippingMethod[] {
  devDebug("[mock:shop] shippingMethods");
  return [
    { id: "standard", name: "Standard", eta: "5–7 days", price: money(6.5), currency: CURRENCY },
    { id: "express", name: "Express", eta: "2–3 days", price: money(14.9), currency: CURRENCY },
    { id: "nextday", name: "Next day", eta: "1 day", price: money(24), currency: CURRENCY },
    { id: "pickup", name: "Pickup", eta: "Today", price: 0, currency: CURRENCY },
  ];
}

/** Place an order from the current cart (W3); clears the cart, returns the new order. */
export function placeOrder(payload: PlaceOrderPayload): OrderDetail {
  devDebug("[mock:shop] placeOrder", payload);
  const items = cartItemsStore();
  if (items.length === 0)
    throw new ValidationError("Validation failed", { _error: "empty_cart" });
  const cart = buildCart();
  const address: CheckoutAddress = payload.address;
  const store = ordersStore();
  const id = Math.max(0, ...store.map((order) => order.id)) + 1;
  const now = new Date().toISOString();
  const lines: OrderLineItem[] = items.map((item, index) => ({
    id: index + 1,
    name: item.name,
    sku: `SKU-${item.product_id}`,
    qty: item.qty,
    price: item.price,
  }));
  const addressText = `${address.address}\n${address.city}, ${address.zip}\n${address.country}`;
  const shippingCost = payload.shipping_price ?? cart.totals.shipping;
  const totals = {
    ...cart.totals,
    shipping: shippingCost,
    total: money(
      cart.totals.subtotal + shippingCost - cart.totals.discount + cart.totals.tax,
    ),
  };
  const order: OrderDetail = {
    id,
    number: `#${10500 + id - 1000}`,
    customer_name: address.name,
    created_at: now,
    status: "processing",
    payment_status: "paid",
    total: totals.total,
    currency: CURRENCY,
    items_count: lines.length,
    customer: {
      name: address.name,
      email: `${address.name.split(" ")[0]?.toLowerCase() ?? "guest"}@example.com`,
      phone: address.phone,
      address: addressText,
    },
    shipping: { name: address.name, address: addressText },
    billing: { name: address.name, address: addressText },
    items: lines,
    totals,
    timeline: [
      { id: 1, at: now, kind: "created", label: "Order placed" },
      { id: 2, at: now, kind: "processing", label: "Payment captured" },
    ],
    shipping_method: payload.shipping_method,
    payment_method: payload.payment_method,
  };
  store.unshift(order);
  persistOrders();
  // Fresh cart after checkout.
  cartCache = [];
  cartPromo = null;
  persistCart();
  return structuredClone(order);
}

/* ---- sellers / marketplace vendors (W3) ---- */

const SELLER_NAMES = [
  "Northwind Goods",
  "Aurora Supply Co.",
  "Cedar & Pine",
  "Vega Electronics",
  "Coral Living",
  "Basalt Hardware",
  "Willow Home",
  "Meridian Optics",
  "Ember Candles",
  "Onyx Outdoors",
  "Fern Botanicals",
  "Halo Studio",
  "Drift Audio",
  "Slate Stationery",
  "Ivory Textiles",
];
const SELLER_STATUSES: SellerStatus[] = ["active", "active", "pending", "active", "suspended"];
const SELLER_SWATCHES = ["#bfdbfe", "#bbf7d0", "#fde68a", "#fecaca", "#ddd6fe", "#a5f3fc"];
const SELLERS_PER_PAGE = 12;

let sellersCache: SellerDetail[] | null = null;

function buildSellers(): SellerDetail[] {
  const base = Date.now();
  return SELLER_NAMES.map((name, index) => {
    const products = 6 + ((index * 7) % 40);
    const revenue = money(4200 + ((index * 53) % 90) * 380);
    const first = name.split(" ")[0]!.toLowerCase();
    return {
      id: 600 + index,
      name,
      logo_color: SELLER_SWATCHES[index % SELLER_SWATCHES.length]!,
      products_count: products,
      revenue,
      currency: CURRENCY,
      rating: Math.round((3.6 + (index % 14) * 0.1) * 10) / 10,
      status: SELLER_STATUSES[index % SELLER_STATUSES.length]!,
      joined_at: new Date(base - (index + 1) * 21 * 24 * 3600 * 1000).toISOString(),
      email: `hello@${first}.example`,
      phone: `+1 555 07${(10 + index).toString().slice(-2)}`,
      location: "Portland, OR",
      about:
        "A demo marketplace vendor used to showcase the sellers directory and vendor profile screens.",
      sales_count: 40 + ((index * 29) % 900),
    };
  });
}

function sellersStore(): SellerDetail[] {
  sellersCache ??= buildSellers();
  return sellersCache;
}

function toSellerListItem(seller: SellerDetail): SellerListItem {
  return {
    id: seller.id,
    name: seller.name,
    logo_color: seller.logo_color,
    products_count: seller.products_count,
    revenue: seller.revenue,
    currency: seller.currency,
    rating: seller.rating,
    status: seller.status,
    joined_at: seller.joined_at,
  };
}

export function listSellers(filters: SellerFilters): Paginated<SellerListItem> {
  devDebug("[mock:shop] listSellers", filters);
  let rows = sellersStore().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q) rows = rows.filter((seller) => seller.name.toLowerCase().includes(q));
  if (filters.status) rows = rows.filter((seller) => seller.status === filters.status);
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "products_count") return (a.products_count - b.products_count) * dir;
    if (sort === "revenue") return (a.revenue - b.revenue) * dir;
    if (sort === "rating") return (a.rating - b.rating) * dir;
    if (sort === "joined_at") return a.joined_at.localeCompare(b.joined_at) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * SELLERS_PER_PAGE, page * SELLERS_PER_PAGE).map(toSellerListItem),
    total: rows.length,
    page,
    per_page: SELLERS_PER_PAGE,
  };
}

export function getSeller(id: number): SellerDetail {
  devDebug("[mock:shop] getSeller", id);
  const seller = sellersStore().find((entry) => entry.id === id);
  if (!seller) throw new ApiError(404, "Seller not found");
  return structuredClone(seller);
}

/** Products attributed to a seller — a deterministic slice of the catalog. */
export function listSellerProducts(id: number): ProductListItem[] {
  devDebug("[mock:shop] listSellerProducts", id);
  const all = productsStore();
  const offset = id % Math.max(1, all.length - 6);
  return all.slice(offset, offset + 6).map(toProductListItem);
}

/* ---- create invoice (W3) ---- */

export function createInvoice(payload: InvoiceDraft): InvoiceDetail {
  devDebug("[mock:shop] invoices.create", payload);
  const lines = payload.items?.filter((line) => line.description?.trim()) ?? [];
  if (lines.length === 0)
    throw new ValidationError("Validation failed", { items: "required" });
  if (!payload.recipient?.name?.trim())
    throw new ValidationError("Validation failed", { recipient: "required" });
  const items: OrderLineItem[] = lines.map((line, index) => ({
    id: index + 1,
    name: line.description,
    sku: "—",
    qty: Math.max(1, line.qty),
    price: money(Math.max(0, line.price)),
  }));
  const subtotal = money(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  const discount = money(Math.max(0, payload.discount ?? 0));
  const tax = money((subtotal - discount) * (Math.max(0, payload.tax_rate ?? 0) / 100));
  const total = money(Math.max(0, subtotal - discount + tax));
  const store = invoicesStore();
  const id = Math.max(0, ...store.map((invoice) => invoice.id)) + 1;
  const now = new Date();
  const created: InvoiceDetail = {
    id,
    number: `INV-2026-${1000 + id}`,
    customer_name: payload.recipient.name,
    issued_at: now.toISOString(),
    due_at: new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString(),
    amount: total,
    currency: CURRENCY,
    status: "draft",
    issuer: payload.issuer,
    recipient: payload.recipient,
    items,
    totals: { subtotal, shipping: 0, discount, tax, total },
    notes: payload.notes ?? "",
  };
  store.unshift(created);
  return structuredClone(created);
}
