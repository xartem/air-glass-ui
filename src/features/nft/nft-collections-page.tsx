import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Layers } from "lucide-react";
import { useNavigate } from "react-router";

import { api, type NftCollectionFilters } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
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

import { NftArt, formatEth } from "./nft-shared";
import { devDebug } from "@/lib/debug";

/*
 * /nft/collections — browse collections as cover+avatar cards with floor, volume
 * and item counts, searchable and sortable. Reachable with nft.view.
 */

type SortOption = NonNullable<NftCollectionFilters["sort"]>;
const SORTS: SortOption[] = ["volume", "floor", "name", "items"];

export function NftCollectionsPage() {
  const locale = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("volume");

  const filters = { q: search || undefined, sort };
  devDebug("[NftCollections] query", filters);

  const collectionsQuery = useQuery({
    queryKey: ["nft", "collections", filters],
    queryFn: () => api.nft.collections(filters),
    placeholderData: (previous) => previous,
  });

  const collections = collectionsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.collections.title")} icon={Layers} />

      <Panel
        icon={Layers}
        title={t("nft.collections.title")}
        description={t("nft.collections.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("nft.collections.search")}
              className="w-56"
            />
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortOption)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("nft.sort.label")} />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`nft.collections.sort.${entry}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-4"
      >
        {collectionsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : collectionsQuery.isError ? (
          <EmptyState
            icon={Layers}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void collectionsQuery.refetch(),
            }}
          />
        ) : collections.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={t("nft.collections.empty")}
            description={t("nft.collections.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => navigate("/nft/ranking")}
                className="glass-card flex flex-col overflow-hidden rounded-2xl text-start transition-shadow hover:shadow-md"
              >
                <div className="relative h-28 w-full">
                  <NftArt
                    gradient={collection.gradient}
                    seed={collection.id}
                    alt={collection.name}
                  />
                  <span className="absolute -bottom-6 start-4 size-14 overflow-hidden rounded-2xl border-4 border-[var(--card)]">
                    <NftArt
                      gradient={collection.avatar_gradient}
                      seed={collection.id + 9}
                      alt={collection.name}
                    />
                  </span>
                </div>
                <div className="mt-8 flex flex-col gap-3 p-4">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">
                      {collection.name}
                    </span>
                    {collection.verified ? (
                      <BadgeCheck className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-center">
                    <Metric
                      label={t("nft.collections.floor")}
                      value={formatEth(
                        collection.floor,
                        collection.token,
                        locale,
                      )}
                    />
                    <Metric
                      label={t("nft.collections.volume")}
                      value={formatEth(
                        collection.volume,
                        collection.token,
                        locale,
                      )}
                    />
                    <Metric
                      label={t("nft.collections.items")}
                      value={String(collection.items_count)}
                    />
                  </dl>
                </div>
              </button>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
