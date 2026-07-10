import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { api, type NftCreator, type NftCreatorFilters } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SearchInput } from "@/components/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { NftArt } from "./nft-shared";

/*
 * /nft/creators — browse artists as cards with an optimistic follow toggle
 * (rolled back on error) and search. Reachable with nft.view.
 */

type SortOption = NonNullable<NftCreatorFilters["sort"]>;
const SORTS: SortOption[] = ["followers", "volume", "items", "name"];

export function NftCreatorsPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("followers");

  const filters = { q: search || undefined, sort };
  const queryKey = ["nft", "creators", filters] as const;
  console.debug("[NftCreators] query", filters);

  const creatorsQuery = useQuery({
    queryKey,
    queryFn: () => api.nft.creators(filters),
    placeholderData: (previous) => previous,
  });

  const followMutation = useMutation({
    mutationFn: (creator: NftCreator) => {
      console.debug("[NftCreators] follow", { id: creator.id });
      return api.nft.follow(creator.id);
    },
    onMutate: async (creator) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NftCreator[]>(queryKey);
      queryClient.setQueryData<NftCreator[]>(queryKey, (rows) =>
        (rows ?? []).map((row) =>
          row.id === creator.id
            ? {
                ...row,
                following: !row.following,
                followers: row.followers + (row.following ? -1 : 1),
              }
            : row,
        ),
      );
      return { previous };
    },
    onError: (_error, _creator, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      toast.error(t("nft.creators.follow_failed"));
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<NftCreator[]>(queryKey, (rows) =>
        (rows ?? []).map((row) => (row.id === updated.id ? updated : row)),
      );
    },
  });

  const creators = creatorsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.creators.title")} icon={Users} />

      <Panel
        icon={Users}
        title={t("nft.creators.title")}
        description={t("nft.creators.hint")}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("nft.creators.search")}
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
                    {t(`nft.creators.sort.${entry}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        contentClassName="p-4"
      >
        {creatorsQuery.isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton key={index} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : creatorsQuery.isError ? (
          <EmptyState
            icon={Users}
            title={t("table.error.title")}
            description={t("table.error.description")}
            action={{
              label: t("common.retry"),
              onClick: () => void creatorsQuery.refetch(),
            }}
          />
        ) : creators.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("nft.creators.empty")}
            description={t("nft.creators.empty_hint")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {creators.map((creator) => (
              <div
                key={creator.id}
                className="glass-card flex flex-col items-center gap-3 rounded-2xl p-5 text-center"
              >
                <span className="size-16 overflow-hidden rounded-full">
                  <NftArt
                    gradient={creator.gradient}
                    seed={creator.id}
                    alt={creator.name}
                  />
                </span>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-medium">{creator.name}</span>
                    {creator.verified ? (
                      <Badge variant="secondary" className="gap-1 px-1.5">
                        <BadgeCheck className="size-3" />
                        {t("nft.creators.verified")}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {creator.handle}
                  </div>
                </div>
                <div className="flex w-full items-center justify-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {formatNumber(creator.followers, locale)}
                    </span>{" "}
                    {t("nft.creators.followers")}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground tabular-nums">
                      {creator.items_count}
                    </span>{" "}
                    {t("nft.creators.items")}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant={creator.following ? "outline" : "default"}
                  className="w-full"
                  onClick={() => followMutation.mutate(creator)}
                >
                  {creator.following
                    ? t("nft.creators.following")
                    : t("nft.creators.follow")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
