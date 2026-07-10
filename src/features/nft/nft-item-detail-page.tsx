import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Gavel, Heart, ShoppingCart } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type NftBid } from "@/api";
import { DataTable } from "@/components/data-table";
import { ErrorPage } from "@/components/error-page";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { devDebug } from "@/lib/debug";
import { formatMoney } from "@/lib/money";
import { useSiteDateTime } from "@/lib/datetime";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { BidDialog, NFT_STATUS_KIND, NftArt, formatEth } from "./nft-shared";

/*
 * /nft/item/:id — single NFT workspace: large media, creator/collection links,
 * buy-now + place-bid CTAs, traits grid, tabbed description and a bid-history
 * table. Not-found renders the 404 archetype. Reachable with nft.view.
 */

export function NftItemDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const locale = useLocale();
  const dt = useSiteDateTime();
  const queryClient = useQueryClient();
  const [bidding, setBidding] = useState(false);

  devDebug("[NftItemDetail] query", { id });
  const itemQuery = useQuery({
    queryKey: ["nft", "item", id],
    queryFn: () => api.nft.item(id),
    enabled: Number.isFinite(id),
    retry: false,
  });

  const bidColumns = useMemo<ColumnDef<NftBid>[]>(
    () => [
      {
        id: "bidder",
        header: t("nft.item.bid.bidder"),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.bidder}</span>
        ),
      },
      {
        id: "amount",
        header: t("nft.item.bid.amount"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatEth(row.original.amount, row.original.token, locale)}
          </span>
        ),
      },
      {
        id: "at",
        header: t("nft.item.bid.time"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {dt.format(row.original.at)}
          </span>
        ),
      },
    ],
    [dt, locale],
  );

  if (itemQuery.isError) return <ErrorPage code="404" />;

  if (itemQuery.isPending) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("nft.item.title")} icon={Gavel} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const item = itemQuery.data;
  const isAuction = item.status === "on_auction";

  return (
    <div className="space-y-4">
      <PageHeader
        title={item.name}
        icon={Gavel}
        breadcrumbs={[
          { label: t("nft.marketplace.title"), href: "/nft/marketplace" },
          { label: item.name },
        ]}
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel contentClassName="p-0">
          <div className="aspect-square overflow-hidden rounded-2xl">
            <NftArt gradient={item.gradient} seed={item.id} alt={item.name} />
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight">
                    {item.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                    <Link
                      to="/nft/collections"
                      className="font-medium text-foreground hover:underline"
                    >
                      {item.collection}
                    </Link>
                    <span>·</span>
                    <span>
                      {t("nft.item.by")}{" "}
                      <Link
                        to="/nft/creators"
                        className="font-medium text-foreground hover:underline"
                      >
                        {item.creator}
                      </Link>
                    </span>
                  </div>
                </div>
                <StatusBadge
                  status={NFT_STATUS_KIND[item.status]}
                  label={t(`nft.status.${item.status}`)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Heart className="size-4" />
                  {t("nft.item.likes", { count: item.likes })}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <BadgeCheck className="size-4" />
                  {t("nft.item.owner")}: {item.owner}
                </span>
              </div>

              <div className="rounded-xl border border-[var(--glass-border)] p-4">
                <div className="text-xs uppercase text-muted-foreground">
                  {isAuction
                    ? t("nft.auction.current_bid")
                    : t("nft.marketplace.price")}
                </div>
                <div className="mt-1 text-2xl font-semibold tabular-nums">
                  {formatEth(
                    item.auction?.current_bid ?? item.price,
                    item.token,
                    locale,
                  )}
                </div>
                <div className="text-sm text-muted-foreground tabular-nums">
                  {formatMoney(
                    item.auction ? item.auction.fiat : item.fiat,
                    item.currency,
                    locale,
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => toast.success(t("nft.item.bought"))}
                  disabled={isAuction}
                >
                  <ShoppingCart className="size-4" />
                  {t("nft.marketplace.buy_now")}
                </Button>
                <Button
                  variant={isAuction ? "default" : "outline"}
                  onClick={() => setBidding(true)}
                  disabled={!isAuction}
                >
                  <Gavel className="size-4" />
                  {t("nft.marketplace.place_bid")}
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel contentClassName="p-2 sm:p-4">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">
              {t("nft.item.tab.description")}
            </TabsTrigger>
            <TabsTrigger value="properties">
              {t("nft.item.tab.properties")}
            </TabsTrigger>
            <TabsTrigger value="bids">{t("nft.item.tab.bids")}</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="pt-4">
            <p className="max-w-2xl text-sm text-muted-foreground">
              {item.description}
            </p>
          </TabsContent>

          <TabsContent value="properties" className="pt-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {item.traits.map((trait) => (
                <div
                  key={trait.type}
                  className="rounded-xl border border-[var(--glass-border)] bg-muted/40 p-3 text-center"
                >
                  <div className="text-[11px] uppercase text-primary">
                    {trait.type}
                  </div>
                  <div className="font-medium">{trait.value}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {t("nft.item.rarity", { pct: trait.rarity })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bids" className="pt-4">
            <DataTable<NftBid>
              label={t("nft.item.tab.bids")}
              columns={bidColumns}
              data={item.bids}
              state={item.bids.length === 0 ? "empty" : "ready"}
              getRowId={(row) => String(row.id)}
              emptyState={{
                title: t("nft.item.no_bids"),
                description: t("nft.item.no_bids_hint"),
              }}
            />
          </TabsContent>
        </Tabs>
      </Panel>

      {bidding && item.auction ? (
        <BidDialog
          auctionId={item.auction.id}
          name={item.name}
          currentBid={item.auction.current_bid}
          token={item.token}
          onClose={() => setBidding(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({
              queryKey: ["nft", "item", id],
            });
          }}
        />
      ) : null}
    </div>
  );
}
