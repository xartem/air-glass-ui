import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  CryptoDepositPayload,
  CryptoMarket,
  CryptoOrder,
  CryptoQuote,
  CryptoTradePayload,
  CryptoTx,
  CryptoTxFilters,
  CryptoWithdrawPayload,
  Holding,
  Ico,
  IcoFilters,
  KycApplication,
  KycPayload,
  Paginated,
  Wallet,
} from "../types";

/*
 * In-memory mock of the crypto module (transactions, markets, trading, wallet,
 * ICOs, KYC). Shapes mirror the API DTOs (../types). Orders + wallet persist in
 * localStorage so trades, cancels and deposits survive reloads.
 */

const CURRENCY = "USD";
const PER_PAGE = 12;
const FEE_RATE = 0.0015;

interface Coin {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", price: 61250.32, change24h: 2.41 },
  { symbol: "ETH", name: "Ethereum", price: 3410.11, change24h: -1.12 },
  { symbol: "USDT", name: "Tether", price: 1.0, change24h: 0.02 },
  { symbol: "BNB", name: "BNB", price: 585.42, change24h: 3.18 },
  { symbol: "SOL", name: "Solana", price: 142.87, change24h: 5.64 },
  { symbol: "XRP", name: "XRP", price: 0.52, change24h: -0.83 },
  { symbol: "ADA", name: "Cardano", price: 0.44, change24h: 1.27 },
  { symbol: "DOGE", name: "Dogecoin", price: 0.13, change24h: -2.19 },
];

const TX_TYPES: CryptoTx["type"][] = ["buy", "sell", "transfer"];
const TX_STATUSES: CryptoTx["status"][] = [
  "completed",
  "completed",
  "completed",
  "pending",
  "failed",
];

function money(base: number): number {
  return Math.round(base * 100) / 100;
}

/** Deterministic axis-less series for sparklines / price charts (no Math.random). */
function series(seed: number, up: boolean, base = 50, length = 24): number[] {
  return Array.from({ length }, (_, i) => {
    const wave = Math.sin((i + seed) / 3) * (base * 0.06);
    const drift = (up ? 1 : -1) * i * (base * 0.006);
    return money(base + wave + drift);
  });
}

function hash(seed: number): string {
  const chars = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < 40; i += 1) out += chars[(seed * 7 + i * 13) % 16];
  return out;
}

/* ---- transactions ---- */

function buildTransactions(): CryptoTx[] {
  const base = Date.now();
  return Array.from({ length: 42 }, (_, index) => {
    const coin = COINS[index % COINS.length]!;
    const type = TX_TYPES[index % TX_TYPES.length]!;
    const amount = money(0.05 + ((index * 37) % 40) * 0.12);
    return {
      id: 9000 + index,
      date: new Date(base - (index + 1) * 7 * 3600 * 1000).toISOString(),
      type,
      coin: coin.symbol,
      amount,
      value: money(coin.price * amount),
      currency: CURRENCY,
      status: TX_STATUSES[index % TX_STATUSES.length]!,
      hash: hash(index + 1),
    };
  });
}

export function cryptoTransactions(
  filters: CryptoTxFilters,
): Paginated<CryptoTx> {
  devDebug("[mock:crypto] transactions", filters);
  let rows = buildTransactions();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (tx) =>
        tx.coin.toLowerCase().includes(q) || tx.hash.toLowerCase().includes(q),
    );
  if (filters.coin) rows = rows.filter((tx) => tx.coin === filters.coin);
  if (filters.type) rows = rows.filter((tx) => tx.type === filters.type);
  if (filters.from) rows = rows.filter((tx) => tx.date >= filters.from!);
  if (filters.to)
    rows = rows.filter((tx) => tx.date <= `${filters.to!}T23:59:59Z`);
  const sort = filters.sort ?? "date";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    if (sort === "value") return (a.value - b.value) * dir;
    return a.date.localeCompare(b.date) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

/* ---- markets + quote ---- */

export function cryptoMarkets(): CryptoMarket[] {
  devDebug("[mock:crypto] markets");
  return COINS.map((coin, index) => ({
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    change24h: coin.change24h,
    currency: CURRENCY,
    spark: series(index + 1, coin.change24h >= 0, coin.price),
  }));
}

function coinForPair(pair: string): Coin {
  const symbol = pair.split("/")[0]?.toUpperCase() ?? "";
  const coin = COINS.find((entry) => entry.symbol === symbol);
  if (!coin) throw new ApiError(404, "Unknown market pair");
  return coin;
}

export function cryptoQuote(pair: string, amount: number): CryptoQuote {
  devDebug("[mock:crypto] quote", { pair, amount });
  const coin = coinForPair(pair);
  const qty = Number.isFinite(amount) ? amount : 0;
  const subtotal = money(coin.price * qty);
  const fee = money(subtotal * FEE_RATE);
  return {
    pair,
    amount: qty,
    price: coin.price,
    subtotal,
    fee,
    total: money(subtotal + fee),
    currency: CURRENCY,
  };
}

/* ---- orders (persisted) ---- */

let ordersCache: CryptoOrder[] | null = null;
const ORDERS_KEY = "mock.crypto.orders";

function buildOrders(): CryptoOrder[] {
  const base = Date.now();
  const sides: CryptoOrder["side"][] = ["buy", "sell"];
  const statuses: CryptoOrder["status"][] = [
    "open",
    "open",
    "filled",
    "filled",
    "cancelled",
  ];
  return Array.from({ length: 14 }, (_, index) => {
    const coin = COINS[index % COINS.length]!;
    const status = statuses[index % statuses.length]!;
    return {
      id: 4000 + index,
      pair: `${coin.symbol}/${CURRENCY}`,
      side: sides[index % sides.length]!,
      price: money(coin.price * (0.98 + (index % 5) * 0.01)),
      amount: money(0.1 + ((index * 17) % 30) * 0.08),
      filled:
        status === "filled"
          ? 100
          : status === "cancelled"
            ? 0
            : 20 + ((index * 13) % 70),
      status,
      created_at: new Date(base - (index + 1) * 5 * 3600 * 1000).toISOString(),
      currency: CURRENCY,
    };
  });
}

function ordersStore(): CryptoOrder[] {
  if (ordersCache) return ordersCache;
  const raw = localStorage.getItem(ORDERS_KEY);
  ordersCache = raw ? (JSON.parse(raw) as CryptoOrder[]) : buildOrders();
  persistOrders();
  return ordersCache;
}

function persistOrders(): void {
  if (ordersCache)
    localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersCache));
}

export function cryptoOrders(status: string | undefined): CryptoOrder[] {
  devDebug("[mock:crypto] orders", status);
  const rows = ordersStore().slice();
  const open = rows.filter((order) => order.status === "open");
  const history = rows.filter((order) => order.status !== "open");
  const scope =
    status === "history" ? history : status === "open" ? open : rows;
  return structuredClone(
    scope.sort((a, b) => b.created_at.localeCompare(a.created_at)),
  );
}

export function cryptoTrade(payload: CryptoTradePayload): CryptoOrder {
  devDebug("[mock:crypto] trade", payload);
  const amount = Number(payload.amount);
  if (!(amount > 0))
    throw new ValidationError("Validation failed", {
      amount: "invalid_amount",
    });
  const coin = coinForPair(payload.pair);
  const store = ordersStore();
  const order: CryptoOrder = {
    id: Math.max(0, ...store.map((entry) => entry.id)) + 1,
    pair: payload.pair,
    side: payload.side,
    price: coin.price,
    amount: money(amount),
    filled: 0,
    status: "open",
    created_at: new Date().toISOString(),
    currency: CURRENCY,
  };
  store.unshift(order);
  persistOrders();
  return structuredClone(order);
}

export function cryptoCancelOrder(id: number): CryptoOrder {
  devDebug("[mock:crypto] cancelOrder", id);
  const order = ordersStore().find((entry) => entry.id === id);
  if (!order) throw new ApiError(404, "Order not found");
  if (order.status !== "open")
    throw new ApiError(422, "order_not_open", "order_not_open");
  order.status = "cancelled";
  persistOrders();
  return structuredClone(order);
}

/* ---- wallet (persisted) ---- */

let walletCache: Holding[] | null = null;
const WALLET_KEY = "mock.crypto.wallet";
const HELD = ["BTC", "ETH", "SOL", "BNB", "USDT"];

function buildHoldings(): Holding[] {
  return HELD.map((symbol, index) => {
    const coin = COINS.find((entry) => entry.symbol === symbol)!;
    const amount = money(
      (index + 1) * (symbol === "USDT" ? 2500 : symbol === "BTC" ? 0.35 : 4.2),
    );
    return {
      symbol: coin.symbol,
      name: coin.name,
      amount,
      price: coin.price,
      value: money(coin.price * amount),
      change24h: coin.change24h,
      spark: series(index + 3, coin.change24h >= 0, coin.price),
      address: `${coin.symbol.toLowerCase()}1q${hash(index + 5).slice(2, 34)}`,
    };
  });
}

function walletStore(): Holding[] {
  if (walletCache) return walletCache;
  const raw = localStorage.getItem(WALLET_KEY);
  walletCache = raw ? (JSON.parse(raw) as Holding[]) : buildHoldings();
  persistWallet();
  return walletCache;
}

function persistWallet(): void {
  if (walletCache)
    localStorage.setItem(WALLET_KEY, JSON.stringify(walletCache));
}

function toWallet(holdings: Holding[]): Wallet {
  const total = holdings.reduce((sum, holding) => sum + holding.value, 0);
  const change =
    total > 0
      ? holdings.reduce((sum, h) => sum + h.change24h * h.value, 0) / total
      : 0;
  return {
    total_value: money(total),
    change_24h: money(change),
    currency: CURRENCY,
    holdings: structuredClone(holdings),
    allocation: holdings.map((holding) => ({
      label: holding.symbol,
      value: money(holding.value),
    })),
  };
}

export function cryptoWallet(): Wallet {
  devDebug("[mock:crypto] wallet");
  return toWallet(walletStore());
}

function holdingFor(coin: string): Holding {
  const holding = walletStore().find((entry) => entry.symbol === coin);
  if (!holding) throw new ApiError(404, "Coin not held");
  return holding;
}

export function cryptoDeposit(payload: CryptoDepositPayload): Wallet {
  devDebug("[mock:crypto] deposit", payload);
  const amount = Number(payload.amount);
  if (!(amount > 0))
    throw new ValidationError("Validation failed", {
      amount: "invalid_amount",
    });
  const holding = holdingFor(payload.coin);
  holding.amount = money(holding.amount + amount);
  holding.value = money(holding.amount * holding.price);
  persistWallet();
  return toWallet(walletStore());
}

export function cryptoWithdraw(payload: CryptoWithdrawPayload): Wallet {
  devDebug("[mock:crypto] withdraw", payload);
  const amount = Number(payload.amount);
  if (!(amount > 0))
    throw new ValidationError("Validation failed", {
      amount: "invalid_amount",
    });
  if (!payload.address?.trim())
    throw new ValidationError("Validation failed", { address: "required" });
  const holding = holdingFor(payload.coin);
  if (amount > holding.amount)
    throw new ValidationError("Validation failed", { amount: "insufficient" });
  holding.amount = money(holding.amount - amount);
  holding.value = money(holding.amount * holding.price);
  persistWallet();
  return toWallet(walletStore());
}

/* ---- ICOs ---- */

const ICO_NAMES = [
  { name: "AuroraChain", symbol: "AUR", color: "#bfdbfe" },
  { name: "NovaLedger", symbol: "NOVA", color: "#bbf7d0" },
  { name: "QuantumPay", symbol: "QPY", color: "#fde68a" },
  { name: "TerraVault", symbol: "TVT", color: "#fecaca" },
  { name: "PulseGrid", symbol: "PLS", color: "#ddd6fe" },
  { name: "OrbitDeFi", symbol: "ORB", color: "#a5f3fc" },
];

function buildIcos(): Ico[] {
  const base = Date.now();
  const statuses: Ico["status"][] = [
    "active",
    "active",
    "upcoming",
    "upcoming",
    "ended",
    "ended",
  ];
  return ICO_NAMES.map((entry, index) => {
    const status = statuses[index % statuses.length]!;
    const goal = 500_000 + index * 250_000;
    const raised =
      status === "ended"
        ? goal
        : status === "upcoming"
          ? 0
          : money(goal * (0.25 + (index % 4) * 0.18));
    const startOffset =
      status === "upcoming" ? 6 : status === "active" ? -3 : -30;
    const endOffset =
      status === "upcoming" ? 26 : status === "active" ? 12 : -6;
    return {
      id: 300 + index,
      name: entry.name,
      symbol: entry.symbol,
      logo_color: entry.color,
      description:
        "A demo token sale used to showcase the ICO listing grid, progress and countdown.",
      price: money(0.05 + index * 0.03),
      currency: CURRENCY,
      raised,
      goal,
      start_at: new Date(base + startOffset * 24 * 3600 * 1000).toISOString(),
      end_at: new Date(base + endOffset * 24 * 3600 * 1000).toISOString(),
      status,
    };
  });
}

export function cryptoIcos(filters: IcoFilters): Ico[] {
  devDebug("[mock:crypto] icos", filters);
  let rows = buildIcos();
  if (filters.status)
    rows = rows.filter((ico) => ico.status === filters.status);
  return rows;
}

export function cryptoGetIco(id: number): Ico {
  devDebug("[mock:crypto] getIco", id);
  const ico = buildIcos().find((entry) => entry.id === id);
  if (!ico) throw new ApiError(404, "ICO not found");
  return ico;
}

/* ---- KYC ---- */

export function cryptoSubmitKyc(payload: KycPayload): KycApplication {
  devDebug("[mock:crypto] submitKyc", payload);
  const fields: Record<string, string> = {};
  if (!payload.full_name?.trim()) fields.full_name = "required";
  if (!payload.dob?.trim()) fields.dob = "required";
  if (!payload.country?.trim()) fields.country = "required";
  if (!payload.id_number?.trim()) fields.id_number = "required";
  if (!payload.documents?.front) fields.front = "required";
  if (!payload.documents?.back) fields.back = "required";
  if (!payload.documents?.selfie) fields.selfie = "required";
  if (Object.keys(fields).length > 0)
    throw new ValidationError("Validation failed", fields);
  return { status: "pending", submitted_at: new Date().toISOString() };
}
