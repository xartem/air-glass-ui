import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gavel, Timer } from "lucide-react";
import { useNavigate } from "react-router";

import { api, type NftAuction } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { devDebug } from "@/lib/debug";
import { formatMoney } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { BidDialog, NftArt, formatEth, useCountdown } from "./nft-shared";

/*
 * /nft/auction — live auctions as cards with an accessible countdown, sorted by
 * ending-soon, and a validated place-bid dialog. Reachable with nft.view.
 */

type SortOption = "ending_soon" | "most_bids" | "highest_bid";
const SORTS: SortOption[] = ["ending_soon", "most_bids", "highest_bid"];

export function NftAuctionPage() {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<SortOption>("ending_soon");
  const [bidding, setBidding] = useState<NftAuction | null>(null);

  devDebug("[NftAuction] query", { sort });
  const auctionsQuery = useQuery({
    queryKey: ["nft", "auctions"],
    queryFn: api.nft.auctions,
  });

  const auctions = useMemo(() => {
    const rows = (auctionsQuery.data ?? []).slice();
    switch (sort) {
      case "most_bids":
        return rows.sort((a, b) => b.bids_count - a.bids_count);
      case "highest_bid":
        return rows.sort((a, b) => b.current_bid - a.current_bid);
      default:
        return rows.sort((a, b) => a.ends_at.localeCompare(b.ends_at));
    }
  }, [auctionsQuery.data, sort]);

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.auction.title")} icon={Gavel} />

      <Panel
        icon={Gavel}
        title={t("nft.auction.live")}
        description={t("nft.auction.hint")}
        actions={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortOption)}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("nft.sort.label")} />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {t(`nft.auction.sort.${entry}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        contentClassName="p-4"
      >
        {auctionsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-96 rounded-2xl" />
            ))}
          </div>
        ) : auctionsQuery.isError ? (
          <EmptyState
            icon={Gavel}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void auctionsQuery.refetch(),
            }}
          />
        ) : auctions.length === 0 ? (
          <EmptyState
            icon={Gavel}
            title={t("nft.auction.empty")}
            description={t("nft.auction.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {auctions.map((auction) => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onBid={() => setBidding(auction)}
              />
            ))}
          </div>
        )}
      </Panel>

      {bidding ? (
        <BidDialog
          auctionId={bidding.id}
          name={bidding.name}
          currentBid={bidding.current_bid}
          token={bidding.token}
          onClose={() => setBidding(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({
              queryKey: ["nft", "auctions"],
            });
            void queryClient.invalidateQueries({
              queryKey: ["nft", "item", bidding.item_id],
            });
          }}
        />
      ) : null}
    </div>
  );
}

function AuctionCard({
  auction,
  onBid,
}: {
  auction: NftAuction;
  onBid: () => void;
}) {
  const locale = useLocale();
  const navigate = useNavigate();

  return (
    <div className="glass-card flex flex-col overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => navigate(`/nft/item/${auction.item_id}`)}
        className="block aspect-square overflow-hidden"
        aria-label={auction.name}
      >
        <NftArt
          gradient={auction.gradient}
          seed={auction.id}
          alt={auction.name}
        />
      </button>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <div className="truncate font-medium">{auction.name}</div>
          <div className="truncate text-xs text-muted-foreground">
            {auction.collection}
          </div>
        </div>
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] uppercase text-muted-foreground">
              {t("nft.auction.current_bid")}
            </div>
            <div className="font-semibold tabular-nums">
              {formatEth(auction.current_bid, auction.token, locale)}
            </div>
            <div className="text-xs text-muted-foreground tabular-nums">
              {formatMoney(auction.fiat, auction.currency, locale)}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("nft.auction.bids_count", { count: auction.bids_count })}
          </span>
        </div>
        <Countdown endsAt={auction.ends_at} />
        <Button className="mt-auto w-full" onClick={onBid}>
          <Gavel className="size-4" />
          {t("nft.auction.place_bid")}
        </Button>
      </div>
    </div>
  );
}

function Countdown({ endsAt }: { endsAt: string }) {
  const { done, days, hours, minutes, seconds } = useCountdown(endsAt);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
      <Timer className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">
        {done ? t("nft.auction.ended") : t("nft.auction.ends_in")}
      </span>
      <span aria-live="polite" className="ms-auto font-medium tabular-nums">
        {done
          ? "—"
          : `${days}${t("countdown.unit.days")} ${hours}${t("countdown.unit.hours")} ${minutes}${t("countdown.unit.minutes")} ${seconds}${t("countdown.unit.seconds")}`}
      </span>
    </div>
  );
}
