import { useEffect, useState } from "react";

import type { NftChain, NftCategory, NftGradient, NftItemStatus } from "@/api";
import { type StatusKind } from "@/components/status-badge";
import { formatNumber } from "@/lib/money";
import type { AdminLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Shared NFT helpers: generated gradient art (no external hosts), token price
 * formatting, filter option lists and a live countdown hook.
 */

export const NFT_CATEGORIES: NftCategory[] = [
  "art",
  "collectibles",
  "music",
  "photography",
  "gaming",
  "sports",
];

export const NFT_CHAINS: NftChain[] = [
  "ethereum",
  "polygon",
  "solana",
  "binance",
];

export const NFT_STATUSES: NftItemStatus[] = [
  "buy_now",
  "on_auction",
  "new",
  "has_offers",
];

export const NFT_STATUS_KIND: Record<NftItemStatus, StatusKind> = {
  buy_now: "success",
  on_auction: "info",
  new: "published",
  has_offers: "pending",
};

/** `1.24 ETH` — token amount with symbol, locale-aware grouping. */
export function formatEth(
  value: number,
  token: string,
  locale: AdminLocale,
): string {
  return `${formatNumber(Math.round(value * 1000) / 1000, locale)} ${token}`;
}

/** Deterministic gradient-art data URI (seeded shapes) built from DTO colors. */
export function nftArtUri(gradient: NftGradient, seed: number): string {
  const [from, to] = gradient;
  const cx = 90 + ((seed * 37) % 220);
  const cy = 70 + ((seed * 53) % 240);
  const r = 60 + ((seed * 17) % 90);
  const cx2 = 120 + ((seed * 29) % 200);
  const cy2 = 130 + ((seed * 41) % 200);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="400" height="400" fill="url(#g)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${to}" fill-opacity="0.55"/>` +
    `<circle cx="${cx2}" cy="${cy2}" r="${r * 0.7}" fill="${from}" fill-opacity="0.5"/>` +
    `<rect x="${cx2 - 40}" y="${cy - 40}" width="80" height="80" rx="16" fill="#ffffff" fill-opacity="0.25"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function NftArt({
  gradient,
  seed,
  alt,
  className,
}: {
  gradient: NftGradient;
  seed: number;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={nftArtUri(gradient, seed)}
      alt={alt}
      loading="lazy"
      className={cn("block size-full object-cover", className)}
    />
  );
}

export interface CountdownParts {
  done: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Ticking countdown to an ISO target; recomputes every second. */
export function useCountdown(targetIso: string): CountdownParts {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const diff = Math.max(0, new Date(targetIso).getTime() - now);
  return {
    done: diff <= 0,
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}
