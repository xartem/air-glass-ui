import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  api,
  type NftChain,
  type NftCategory,
  type NftGradient,
  type NftItemStatus,
} from "@/api";
import { FormField } from "@/components/form-field";
import { type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumberField } from "@/components/ui/number-field";
import { devDebug } from "@/lib/debug";
import { formatNumber } from "@/lib/money";
import { t, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * Shared NFT helpers: generated gradient art (no external hosts), token price
 * formatting, filter option lists, a live countdown hook and the bid dialog.
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

/** Place-bid dialog shared by the auction grid and the item detail screen. */
export function BidDialog({
  auctionId,
  name,
  currentBid,
  token,
  onClose,
  onSuccess,
}: {
  auctionId: number;
  name: string;
  currentBid: number;
  token: string;
  onClose: () => void;
  /** Post-bid refresh (query invalidation / refetch) differs per screen. */
  onSuccess: () => void;
}) {
  const locale = useLocale();
  const [amount, setAmount] = useState<number>(
    Math.round((currentBid + 0.1) * 100) / 100,
  );
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: number) => {
      devDebug("[NftBidDialog] bid", { auctionId, amount: value });
      return api.nft.bid(auctionId, value);
    },
    onSuccess: () => {
      toast.success(t("nft.auction.bid_placed"));
      onSuccess();
      onClose();
    },
    onError: () => toast.error(t("nft.auction.bid_failed")),
  });

  function submit() {
    if (!(amount > currentBid)) {
      setError(t("nft.auction.error.too_low"));
      return;
    }
    setError(null);
    mutation.mutate(amount);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("nft.auction.bid_title", { name })}</DialogTitle>
          <DialogDescription>
            {t("nft.auction.current_bid")}:{" "}
            {formatEth(currentBid, token, locale)}
          </DialogDescription>
        </DialogHeader>
        <FormField
          name="amount"
          label={t("nft.auction.your_bid")}
          required
          error={error ?? undefined}
        >
          <NumberField
            value={amount}
            min={0}
            step={0.05}
            onValueChange={(value) => setAmount(value ?? 0)}
          />
        </FormField>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" onClick={submit} disabled={mutation.isPending}>
            {t("nft.auction.place_bid")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
