import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Gem, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";

import { api, type NftCategory } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

import { NftItemCard } from "./nft-item-card";
import { NFT_CATEGORIES, NftArt, formatEth } from "./nft-shared";
import { devDebug } from "@/lib/debug";

/*
 * /nft/marketplace — marketplace home: hero banner, category chips, a featured
 * collections carousel and an item card grid with sort. Reachable with nft.view.
 */

type SortOption = "recent" | "price_asc" | "price_desc" | "likes";
const SORTS: SortOption[] = ["recent", "price_asc", "price_desc", "likes"];

export function NftMarketplacePage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const [category, setCategory] = useState<NftCategory | "all">("all");
  const [sort, setSort] = useState<SortOption>("recent");

  const filters = {
    category: category === "all" ? undefined : category,
    sort,
  };
  devDebug("[NftMarketplace] query", filters);

  const itemsQuery = useQuery({
    queryKey: ["nft", "items", "marketplace", filters],
    queryFn: () => api.nft.items(filters),
    placeholderData: (previous) => previous,
  });
  const collectionsQuery = useQuery({
    queryKey: ["nft", "collections", "featured"],
    queryFn: () => api.nft.collections({ sort: "volume" }),
  });

  const items = itemsQuery.data?.rows ?? [];
  const collections = collectionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.marketplace.title")} icon={Gem} />

      <div className="glass-card relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            {t("nft.marketplace.hero_tag")}
          </span>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("nft.marketplace.hero_title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("nft.marketplace.hero_subtitle")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={() => navigate("/nft/explore")}>
              {t("nft.marketplace.explore")}
            </Button>
            <Button variant="outline" onClick={() => navigate("/nft/create")}>
              {t("nft.marketplace.create")}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label={t("nft.category.all")}
        />
        {NFT_CATEGORIES.map((entry) => (
          <CategoryChip
            key={entry}
            active={category === entry}
            onClick={() => setCategory(entry)}
            label={t(`nft.category.${entry}`)}
          />
        ))}
      </div>

      <Panel
        icon={BadgeCheck}
        title={t("nft.marketplace.featured")}
        description={t("nft.marketplace.featured_hint")}
        contentClassName="p-4"
      >
        {collectionsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : (
          <Carousel opts={{ align: "start" }} className="px-1">
            <CarouselContent>
              {collections.map((collection) => (
                <CarouselItem
                  key={collection.id}
                  className="sm:basis-1/2 lg:basis-1/3"
                >
                  <button
                    type="button"
                    onClick={() => navigate("/nft/collections")}
                    className="glass-card flex w-full flex-col overflow-hidden rounded-2xl text-start transition-shadow hover:shadow-md"
                  >
                    <div className="h-24 w-full">
                      <NftArt
                        gradient={collection.gradient}
                        seed={collection.id}
                        alt={collection.name}
                      />
                    </div>
                    <div className="flex items-center gap-3 p-4">
                      <span className="size-10 shrink-0 overflow-hidden rounded-xl">
                        <NftArt
                          gradient={collection.avatar_gradient}
                          seed={collection.id + 9}
                          alt={collection.name}
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="truncate font-medium">
                            {collection.name}
                          </span>
                          {collection.verified ? (
                            <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                          ) : null}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {t("nft.collections.floor")}:{" "}
                          {formatEth(
                            collection.floor,
                            collection.token,
                            locale,
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </Panel>

      <Panel
        icon={Gem}
        title={t("nft.marketplace.items")}
        description={t("nft.marketplace.items_hint")}
        actions={
          <Select
            value={sort}
            onValueChange={(value) => setSort(value as SortOption)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("nft.sort.label")} />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((entry) => (
                <SelectItem key={entry} value={entry}>
                  {t(`nft.sort.${entry}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        contentClassName="p-4"
      >
        {itemsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-80 rounded-2xl" />
            ))}
          </div>
        ) : itemsQuery.isError ? (
          <EmptyState
            icon={Gem}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void itemsQuery.refetch(),
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Gem}
            title={t("nft.marketplace.empty")}
            description={t("nft.marketplace.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <NftItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-input text-muted-foreground hover:bg-accent/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
