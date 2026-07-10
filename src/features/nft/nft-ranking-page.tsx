import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Trophy, TrendingDown, TrendingUp } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { api, type NftRankingPeriod, type RankingRow } from "@/api";
import { DataTable } from "@/components/data-table";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

import { NftArt, formatEth } from "./nft-shared";

/*
 * /nft/ranking — collection leaderboard across periods with floor, volume, a 24h
 * change delta indicator, owners and item counts. Reachable with nft.view.
 */

const PERIODS: NftRankingPeriod[] = ["24h", "7d", "30d", "all"];

export function NftRankingPage() {
  const locale = useLocale();
  const [period, setPeriod] = useState<NftRankingPeriod>("24h");

  console.debug("[NftRanking] query", { period });
  const rankingQuery = useQuery({
    queryKey: ["nft", "ranking", period],
    queryFn: () => api.nft.ranking(period),
    placeholderData: (previous) => previous,
  });

  const columns = useMemo<ColumnDef<RankingRow>[]>(
    () => [
      {
        id: "rank",
        header: t("nft.ranking.col.rank"),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.rank}
          </span>
        ),
      },
      {
        id: "collection",
        header: t("nft.ranking.col.collection"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="size-9 shrink-0 overflow-hidden rounded-xl">
              <NftArt
                gradient={row.original.gradient}
                seed={row.original.collection_id}
                alt={row.original.collection}
              />
            </span>
            <span className="flex items-center gap-1 font-medium">
              {row.original.collection}
              {row.original.verified ? (
                <BadgeCheck className="size-3.5 text-primary" />
              ) : null}
            </span>
          </div>
        ),
      },
      {
        id: "floor",
        header: t("nft.ranking.col.floor"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatEth(row.original.floor, row.original.token, locale)}
          </span>
        ),
      },
      {
        id: "volume",
        header: t("nft.ranking.col.volume"),
        cell: ({ row }) => (
          <span className="tabular-nums">
            {formatEth(row.original.volume, row.original.token, locale)}
          </span>
        ),
      },
      {
        id: "change",
        header: t("nft.ranking.col.change"),
        cell: ({ row }) => <Delta value={row.original.change24h} />,
      },
      {
        id: "owners",
        header: t("nft.ranking.col.owners"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatNumber(row.original.owners, locale)}
          </span>
        ),
      },
      {
        id: "items",
        header: t("nft.ranking.col.items"),
        meta: { className: "max-md:hidden" },
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatNumber(row.original.items, locale)}
          </span>
        ),
      },
    ],
    [locale],
  );

  const data = rankingQuery.data ?? [];
  const state = rankingQuery.isPending
    ? "loading"
    : rankingQuery.isError
      ? "error"
      : data.length === 0
        ? "empty"
        : "ready";

  return (
    <div className="space-y-4">
      <PageHeader title={t("nft.ranking.title")} icon={Trophy} />

      <Panel
        icon={Trophy}
        title={t("nft.ranking.title")}
        description={t("nft.ranking.hint")}
        actions={
          <Tabs
            value={period}
            onValueChange={(value) => setPeriod(value as NftRankingPeriod)}
          >
            <TabsList>
              {PERIODS.map((entry) => (
                <TabsTrigger key={entry} value={entry}>
                  {t(`nft.ranking.period.${entry}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
        contentClassName="p-2 sm:p-3"
      >
        <DataTable<RankingRow>
          label={t("nft.ranking.title")}
          columns={columns}
          data={data}
          state={state}
          getRowId={(row) => String(row.collection_id)}
          onRetry={() => void rankingQuery.refetch()}
          emptyState={{
            title: t("nft.ranking.empty"),
            description: t("nft.ranking.empty_hint"),
          }}
        />
      </Panel>
    </div>
  );
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-medium tabular-nums"
      style={{
        color: up ? "var(--status-success-fg)" : "var(--status-error-fg)",
      }}
    >
      {up ? (
        <TrendingUp className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      )}
      {up ? "+" : ""}
      {(value * 100).toFixed(1)}%
    </span>
  );
}
