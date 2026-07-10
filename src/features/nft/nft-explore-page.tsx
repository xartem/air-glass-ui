import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Compass, SlidersHorizontal } from "lucide-react";

import {
  api,
  type NftCategory,
  type NftChain,
  type NftItemStatus,
} from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { PaginationBar } from "@/components/pagination-bar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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

import { NftItemCard } from "./nft-item-card";
import {
  NFT_CATEGORIES,
  NFT_CHAINS,
  NFT_STATUSES,
  formatEth,
} from "./nft-shared";
import { devDebug } from "@/lib/debug";

/*
 * /nft/explore — full catalogue with a rich filter sidebar (price range, category,
 * status and chain) plus a sorted, paged item grid. Reachable with nft.view.
 */

type SortOption = "recent" | "price_asc" | "price_desc" | "likes";
const SORTS: SortOption[] = ["recent", "price_asc", "price_desc", "likes"];
const MAX_PRICE = 12;

export function NftExplorePage() {
  const locale = useLocale();
  const [category, setCategory] = useState<NftCategory | null>(null);
  const [chain, setChain] = useState<NftChain | null>(null);
  const [status, setStatus] = useState<NftItemStatus | null>(null);
  const [range, setRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [sort, setSort] = useState<SortOption>("recent");
  const [page, setPage] = useState(1);

  const filters = {
    page,
    category: category ?? undefined,
    chain: chain ?? undefined,
    status: status ?? undefined,
    min: range[0] > 0 ? range[0] : undefined,
    max: range[1] < MAX_PRICE ? range[1] : undefined,
    sort,
  };
  devDebug("[NftExplore] query", filters);

  const listQuery = useQuery({
    queryKey: ["nft", "items", "explore", filters],
    queryFn: () => api.nft.items(filters),
    placeholderData: (previous) => previous,
  });

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function clearAll() {
    setCategory(null);
    setChain(null);
    setStatus(null);
    setRange([0, MAX_PRICE]);
    setPage(1);
  }

  const data = listQuery.data;
  const items = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.explore.title")} icon={Compass} />

      <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
        <Panel
          icon={SlidersHorizontal}
          title={t("nft.explore.filters")}
          actions={
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {t("common.clear")}
            </Button>
          }
          className="lg:sticky lg:top-4 lg:self-start"
        >
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="text-sm font-medium">
                {t("nft.explore.price_range")}
              </div>
              <Slider
                value={range}
                min={0}
                max={MAX_PRICE}
                step={0.5}
                onValueChange={(value) =>
                  setRange([value[0]!, value[1]!] as [number, number])
                }
                onValueCommit={() => setPage(1)}
                aria-label={t("nft.explore.price_range")}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                <span>{formatEth(range[0], "ETH", locale)}</span>
                <span>{formatEth(range[1], "ETH", locale)}</span>
              </div>
            </div>

            <FilterGroup
              title={t("nft.explore.category")}
              options={NFT_CATEGORIES}
              selected={category}
              onToggle={resetPage((value: NftCategory | null) =>
                setCategory(value),
              )}
              labelFor={(value) => t(`nft.category.${value}`)}
            />
            <FilterGroup
              title={t("nft.explore.status")}
              options={NFT_STATUSES}
              selected={status}
              onToggle={resetPage((value: NftItemStatus | null) =>
                setStatus(value),
              )}
              labelFor={(value) => t(`nft.status.${value}`)}
            />
            <FilterGroup
              title={t("nft.explore.chain")}
              options={NFT_CHAINS}
              selected={chain}
              onToggle={resetPage((value: NftChain | null) => setChain(value))}
              labelFor={(value) => t(`nft.chain.${value}`)}
            />
          </div>
        </Panel>

        <Panel
          icon={Compass}
          title={t("nft.explore.results")}
          description={t("nft.explore.results_hint")}
          actions={
            <Select
              value={sort}
              onValueChange={(value) => {
                setSort(value as SortOption);
                setPage(1);
              }}
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
          {listQuery.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Skeleton key={index} className="h-80 rounded-2xl" />
              ))}
            </div>
          ) : listQuery.isError ? (
            <EmptyState
              icon={Compass}
              title={t("table.error.title")}
              description={t("table.error.description")}
              action={{
                label: t("common.retry"),
                onClick: () => void listQuery.refetch(),
              }}
            />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={t("nft.explore.empty")}
              description={t("nft.explore.empty_hint")}
              action={{ label: t("common.clear"), onClick: clearAll }}
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <NftItemCard key={item.id} item={item} />
                ))}
              </div>
              {data ? (
                <PaginationBar
                  pagination={{
                    page: data.page,
                    perPage: data.per_page,
                    total: data.total,
                    pages: Math.max(1, Math.ceil(data.total / data.per_page)),
                  }}
                  shown={data.rows.length}
                  onPage={(next) => setPage(next)}
                />
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function FilterGroup<T extends string>({
  title,
  options,
  selected,
  onToggle,
  labelFor,
}: {
  title: string;
  options: T[];
  selected: T | null;
  onToggle: (value: T | null) => void;
  labelFor: (value: T) => string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{title}</legend>
      <div className="space-y-1.5">
        {options.map((option) => {
          const checked = selected === option;
          return (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(checked ? null : option)}
              />
              {labelFor(option)}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
