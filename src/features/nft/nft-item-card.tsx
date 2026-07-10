import { Heart } from "lucide-react";
import { useNavigate } from "react-router";

import type { NftItem } from "@/api";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { NFT_STATUS_KIND, NftArt, formatEth } from "./nft-shared";

/*
 * Shared marketplace / explore item card: generated media, name, collection,
 * price, a like meter (Rating) and a buy / place-bid CTA into the item detail.
 */

export function NftItemCard({ item }: { item: NftItem }) {
  const locale = useLocale();
  const navigate = useNavigate();
  const isAuction = item.status === "on_auction";
  const rating = Math.max(1, Math.min(5, Math.round(item.likes / 100)));

  return (
    <div className="glass-card group flex flex-col overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => navigate(`/nft/item/${item.id}`)}
        className="relative block aspect-square overflow-hidden"
        aria-label={item.name}
      >
        <NftArt
          gradient={item.gradient}
          seed={item.id}
          alt={item.name}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <StatusBadge
          status={NFT_STATUS_KIND[item.status]}
          label={t(`nft.status.${item.status}`)}
          className="absolute start-3 top-3"
        />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/nft/item/${item.id}`)}
              className="truncate text-start font-medium hover:underline"
            >
              {item.name}
            </button>
            <div className="truncate text-xs text-muted-foreground">
              {item.collection}
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Heart className="size-3.5" />
            {item.likes}
          </span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase text-muted-foreground">
              {isAuction
                ? t("nft.marketplace.current_bid")
                : t("nft.marketplace.price")}
            </div>
            <div className="font-semibold tabular-nums">
              {formatEth(item.price, item.token, locale)}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatMoney(item.fiat, item.currency, locale)}
            </div>
          </div>
          <Rating
            value={rating}
            readOnly
            size="sm"
            label={t("nft.marketplace.likes")}
          />
        </div>
        <Button
          size="sm"
          variant={isAuction ? "outline" : "default"}
          className="mt-auto w-full"
          onClick={() => navigate(`/nft/item/${item.id}`)}
        >
          {isAuction
            ? t("nft.marketplace.place_bid")
            : t("nft.marketplace.buy_now")}
        </Button>
      </div>
    </div>
  );
}
