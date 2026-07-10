import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  NftAuction,
  NftBid,
  NftCollection,
  NftCollectionFilters,
  NftCreatePayload,
  NftCreator,
  NftCreatorFilters,
  NftGradient,
  NftItem,
  NftItemDetail,
  NftItemFilters,
  NftMintResult,
  NftRankingPeriod,
  NftTrait,
  Paginated,
  RankingRow,
} from "../types";

/*
 * In-memory mock of the NFT niche (marketplace, explore, auctions, item detail,
 * collections, creators, ranking, mint). Shapes mirror the API DTOs (../types).
 * Follows and live bids persist in localStorage so they survive reloads. All art
 * is generated gradient SVG built client-side from `gradient` (no external hosts).
 */

const TOKEN = "ETH";
const CURRENCY = "USD";
const ETH_USD = 3410.11;
const PER_PAGE = 12;

const GRADIENTS: NftGradient[] = [
  ["#c7d2fe", "#a5b4fc"],
  ["#bfdbfe", "#93c5fd"],
  ["#bbf7d0", "#86efac"],
  ["#fde68a", "#fcd34d"],
  ["#fecaca", "#fca5a5"],
  ["#ddd6fe", "#c4b5fd"],
  ["#a5f3fc", "#67e8f9"],
  ["#fbcfe8", "#f9a8d4"],
];

const CATEGORIES: NftItem["category"][] = [
  "art",
  "collectibles",
  "music",
  "photography",
  "gaming",
  "sports",
];
const CHAINS: NftItem["chain"][] = ["ethereum", "polygon", "solana", "binance"];
const STATUSES: NftItem["status"][] = [
  "buy_now",
  "on_auction",
  "new",
  "has_offers",
];

const COLLECTION_NAMES = [
  "Cosmic Voyagers",
  "Neon Genesis",
  "Pixel Pioneers",
  "Ether Bloom",
  "Cyber Samurai",
  "Astral Apes",
  "Meta Mfers",
  "Lumen Dreams",
];

const CREATOR_NAMES = [
  "Ava Sterling",
  "Milo Chen",
  "Nadia Rahman",
  "Leo Marchetti",
  "Yuki Tanaka",
  "Priya Anand",
  "Diego Alvarez",
  "Freya Nilsson",
];

const ITEM_WORDS = [
  "Genesis",
  "Nova",
  "Aurora",
  "Prism",
  "Echo",
  "Zenith",
  "Vertex",
  "Halo",
  "Flux",
  "Ember",
  "Onyx",
  "Cipher",
];

const TRAIT_TYPES = ["Background", "Body", "Eyes", "Headwear", "Aura"];
const TRAIT_VALUES = [
  "Cosmic",
  "Golden",
  "Laser",
  "Crown",
  "Radiant",
  "Shadow",
  "Neon",
  "Frost",
];

const ITEM_COUNT = 48;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function gradientFor(seed: number): NftGradient {
  return GRADIENTS[seed % GRADIENTS.length]!;
}

/** Deterministic token price in the 0.05–12 ETH range. */
function ethPrice(seed: number): number {
  return round(0.05 + ((seed * 53) % 1195) * 0.01);
}

function shortAddress(seed: number): string {
  const chars = "0123456789abcdef";
  let out = "0x";
  for (let i = 0; i < 8; i += 1) out += chars[(seed * 7 + i * 13) % 16];
  return out;
}

/* ---- items ---- */

function buildItems(): NftItem[] {
  return Array.from({ length: ITEM_COUNT }, (_, index) => {
    const collectionIndex = index % COLLECTION_NAMES.length;
    const creatorIndex = (index * 3) % CREATOR_NAMES.length;
    const price = ethPrice(index + 1);
    return {
      id: 5000 + index,
      name: `${ITEM_WORDS[index % ITEM_WORDS.length]} #${100 + index}`,
      collection: COLLECTION_NAMES[collectionIndex]!,
      collection_id: 700 + collectionIndex,
      creator: CREATOR_NAMES[creatorIndex]!,
      creator_id: 800 + creatorIndex,
      price,
      token: TOKEN,
      fiat: round(price * ETH_USD),
      currency: CURRENCY,
      likes: 12 + ((index * 37) % 480),
      category: CATEGORIES[index % CATEGORIES.length]!,
      chain: CHAINS[index % CHAINS.length]!,
      status: STATUSES[index % STATUSES.length]!,
      gradient: gradientFor(index),
    };
  });
}

function sortItems(rows: NftItem[], sort: NftItemFilters["sort"]): NftItem[] {
  const copy = rows.slice();
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "likes":
      return copy.sort((a, b) => b.likes - a.likes);
    default:
      return copy.sort((a, b) => b.id - a.id);
  }
}

export function nftItems(filters: NftItemFilters): Paginated<NftItem> {
  devDebug("[mock:nft] items", filters);
  let rows = buildItems();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.collection.toLowerCase().includes(q) ||
        item.creator.toLowerCase().includes(q),
    );
  if (filters.category)
    rows = rows.filter((item) => item.category === filters.category);
  if (filters.chain) rows = rows.filter((item) => item.chain === filters.chain);
  if (filters.status)
    rows = rows.filter((item) => item.status === filters.status);
  if (filters.collection !== undefined)
    rows = rows.filter((item) => item.collection_id === filters.collection);
  if (filters.min !== undefined)
    rows = rows.filter((item) => item.price >= filters.min!);
  if (filters.max !== undefined)
    rows = rows.filter((item) => item.price <= filters.max!);
  rows = sortItems(rows, filters.sort);
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

/* ---- item detail (with persisted bids) ---- */

function buildTraits(seed: number): NftTrait[] {
  return TRAIT_TYPES.map((type, index) => ({
    type,
    value: TRAIT_VALUES[(seed + index) % TRAIT_VALUES.length]!,
    rarity: 4 + ((seed * (index + 3)) % 46),
  }));
}

function seededBids(item: NftItem): NftBid[] {
  const base = Date.now();
  const count = 3 + (item.id % 3);
  return Array.from({ length: count }, (_, index) => {
    const amount = round(item.price * (0.7 + index * 0.09));
    return {
      id: item.id * 100 + index,
      bidder: CREATOR_NAMES[(item.id + index) % CREATOR_NAMES.length]!,
      amount,
      token: TOKEN,
      at: new Date(base - (index + 1) * 3 * 3600 * 1000).toISOString(),
    };
  });
}

export function nftItem(id: number): NftItemDetail {
  devDebug("[mock:nft] item", id);
  const item = buildItems().find((entry) => entry.id === id);
  if (!item) throw new ApiError(404, "NFT not found");
  const stored = bidStore()[id];
  const bids = [...(stored?.entries ?? []), ...seededBids(item)].sort((a, b) =>
    b.at.localeCompare(a.at),
  );
  const auction = item.status === "on_auction" ? auctionForItem(item) : null;
  return {
    ...item,
    description:
      "A generative demo artwork minted to showcase the item detail workspace — media, traits, live bids and the buy / place-bid flows.",
    owner: shortAddress(item.id),
    token_id: String(item.id),
    traits: buildTraits(item.id),
    bids,
    auction,
  };
}

/* ---- auctions (with persisted live bids) ---- */

interface StoredBid {
  current: number;
  count: number;
  entries: NftBid[];
}

let bidCache: Record<number, StoredBid> | null = null;
const BIDS_KEY = "mock.nft.bids";

function bidStore(): Record<number, StoredBid> {
  if (bidCache) return bidCache;
  const raw = localStorage.getItem(BIDS_KEY);
  bidCache = raw ? (JSON.parse(raw) as Record<number, StoredBid>) : {};
  return bidCache;
}

function persistBids(): void {
  if (bidCache) localStorage.setItem(BIDS_KEY, JSON.stringify(bidCache));
}

function auctionForItem(item: NftItem): NftAuction {
  const stored = bidStore()[item.id];
  const seededBidsCount = 4 + (item.id % 6);
  const base = round(item.price * 0.9);
  const current = stored?.current ?? base;
  const count = (stored?.count ?? 0) + seededBidsCount;
  // Deterministic end offset: some auctions end soon, others later.
  const hours = 2 + ((item.id * 7) % 70);
  return {
    id: item.id,
    item_id: item.id,
    name: item.name,
    collection: item.collection,
    creator: item.creator,
    current_bid: current,
    token: TOKEN,
    fiat: round(current * ETH_USD),
    currency: CURRENCY,
    ends_at: new Date(Date.now() + hours * 3600 * 1000).toISOString(),
    bids_count: count,
    gradient: item.gradient,
  };
}

export function nftAuctions(): NftAuction[] {
  devDebug("[mock:nft] auctions");
  return buildItems()
    .filter((item) => item.status === "on_auction")
    .map((item) => auctionForItem(item))
    .sort((a, b) => a.ends_at.localeCompare(b.ends_at));
}

export function nftBid(id: number, amount: number): NftAuction {
  devDebug("[mock:nft] bid", { id, amount });
  const item = buildItems().find((entry) => entry.id === id);
  if (!item || item.status !== "on_auction")
    throw new ApiError(404, "Auction not found");
  const current = auctionForItem(item);
  const next = Number(amount);
  if (!(next > current.current_bid))
    throw new ValidationError("Validation failed", { amount: "too_low" });
  const store = bidStore();
  const prev = store[id];
  const entry: NftBid = {
    id: Date.now(),
    bidder: "You",
    amount: round(next),
    token: TOKEN,
    at: new Date().toISOString(),
  };
  store[id] = {
    current: round(next),
    count: (prev?.count ?? 0) + 1,
    entries: [entry, ...(prev?.entries ?? [])].slice(0, 20),
  };
  persistBids();
  return auctionForItem(item);
}

/* ---- collections ---- */

function buildCollections(): NftCollection[] {
  return COLLECTION_NAMES.map((name, index) => {
    const floor = ethPrice(index + 5);
    return {
      id: 700 + index,
      name,
      creator: CREATOR_NAMES[index % CREATOR_NAMES.length]!,
      floor,
      volume: round(floor * (120 + index * 45)),
      items_count: 320 + index * 88,
      owners_count: 140 + index * 37,
      token: TOKEN,
      currency: CURRENCY,
      verified: index % 3 !== 2,
      category: CATEGORIES[index % CATEGORIES.length]!,
      gradient: gradientFor(index),
      avatar_gradient: gradientFor(index + 3),
    };
  });
}

export function nftCollections(filters: NftCollectionFilters): NftCollection[] {
  devDebug("[mock:nft] collections", filters);
  let rows = buildCollections();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (collection) =>
        collection.name.toLowerCase().includes(q) ||
        collection.creator.toLowerCase().includes(q),
    );
  switch (filters.sort) {
    case "floor":
      rows.sort((a, b) => b.floor - a.floor);
      break;
    case "name":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "items":
      rows.sort((a, b) => b.items_count - a.items_count);
      break;
    default:
      rows.sort((a, b) => b.volume - a.volume);
  }
  return rows;
}

/* ---- creators (persisted follow) ---- */

let followCache: Record<number, boolean> | null = null;
const FOLLOW_KEY = "mock.nft.follows";

function followStore(): Record<number, boolean> {
  if (followCache) return followCache;
  const raw = localStorage.getItem(FOLLOW_KEY);
  followCache = raw ? (JSON.parse(raw) as Record<number, boolean>) : {};
  return followCache;
}

function persistFollows(): void {
  if (followCache)
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(followCache));
}

function buildCreator(index: number): NftCreator {
  const id = 800 + index;
  const overridden = followStore()[id];
  const baseFollowing = index % 4 === 0;
  const following = overridden ?? baseFollowing;
  const baseFollowers = 1800 + index * 640;
  return {
    id,
    name: CREATOR_NAMES[index]!,
    handle: `@${CREATOR_NAMES[index]!.toLowerCase().replace(/\s+/g, "")}`,
    followers: baseFollowers + (following ? 1 : 0) - (baseFollowing ? 1 : 0),
    items_count: 24 + index * 11,
    volume: round(ethPrice(index + 9) * (80 + index * 30)),
    token: TOKEN,
    verified: index % 3 !== 1,
    following,
    gradient: gradientFor(index + 2),
  };
}

export function nftCreators(filters: NftCreatorFilters): NftCreator[] {
  devDebug("[mock:nft] creators", filters);
  let rows = CREATOR_NAMES.map((_, index) => buildCreator(index));
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (creator) =>
        creator.name.toLowerCase().includes(q) ||
        creator.handle.toLowerCase().includes(q),
    );
  switch (filters.sort) {
    case "volume":
      rows.sort((a, b) => b.volume - a.volume);
      break;
    case "items":
      rows.sort((a, b) => b.items_count - a.items_count);
      break;
    case "name":
      rows.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      rows.sort((a, b) => b.followers - a.followers);
  }
  return rows;
}

export function nftFollow(id: number): NftCreator {
  devDebug("[mock:nft] follow", id);
  const index = id - 800;
  if (index < 0 || index >= CREATOR_NAMES.length)
    throw new ApiError(404, "Creator not found");
  const store = followStore();
  const current = buildCreator(index);
  store[id] = !current.following;
  persistFollows();
  return buildCreator(index);
}

/* ---- ranking ---- */

const PERIOD_SCALE: Record<NftRankingPeriod, number> = {
  "24h": 1,
  "7d": 6.4,
  "30d": 24,
  all: 180,
};

export function nftRanking(period: NftRankingPeriod): RankingRow[] {
  devDebug("[mock:nft] ranking", period);
  const scale = PERIOD_SCALE[period] ?? 1;
  return buildCollections()
    .map((collection, index) => ({
      collection,
      volume: round(collection.volume * scale),
      change24h: (((index * 37 + PERIOD_SCALE[period] * 11) % 61) - 30) / 100,
    }))
    .sort((a, b) => b.volume - a.volume)
    .map((entry, index) => ({
      rank: index + 1,
      collection_id: entry.collection.id,
      collection: entry.collection.name,
      floor: entry.collection.floor,
      volume: entry.volume,
      change24h: entry.change24h,
      owners: entry.collection.owners_count,
      items: entry.collection.items_count,
      token: TOKEN,
      currency: CURRENCY,
      verified: entry.collection.verified,
      gradient: entry.collection.gradient,
    }));
}

/* ---- create / mint (demo) ---- */

export function nftCreate(payload: NftCreatePayload): NftMintResult {
  devDebug("[mock:nft] create", payload);
  const fields: Record<string, string> = {};
  if (!payload.name?.trim()) fields.name = "required";
  if (!payload.art?.trim()) fields.art = "required";
  if (payload.collection_id === undefined || payload.collection_id === null)
    fields.collection_id = "required";
  if (!(Number(payload.price) > 0)) fields.price = "invalid";
  if (Object.keys(fields).length > 0)
    throw new ValidationError("Validation failed", fields);
  const id = Date.now();
  return {
    id,
    name: payload.name,
    status: "minted",
    token_id: String(id),
  };
}
