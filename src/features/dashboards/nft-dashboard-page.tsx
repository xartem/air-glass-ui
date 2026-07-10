import { useEffect, useState } from "react";
import { BarChart3, Gavel, Gem, Images, Trophy } from "lucide-react";

import type { NftDashboardPayload } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { t } from "@/lib/i18n";
import { formatNumber } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { CategoryBars } from "@/components/charts/category-bars";
import { ChangeTag } from "@/components/change-tag";
import { KpiTile, Leaderboard } from "./widgets";

/*
 * NFT dashboard: marketplace metrics for a period. KPI row + volume bars, then
 * trending collections, live auction countdowns and a top-creators board.
 * Floor/volume amounts are in the collection's native token (ETH).
 */

/** Live mm:ss countdown to an ISO end time; the interval is cleared on unmount. */
function Countdown({ endsAt }: { endsAt: string }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(endsAt).getTime() - Date.now()),
  );
  useEffect(() => {
    const end = new Date(endsAt).getTime();
    const id = window.setInterval(() => {
      setRemaining(Math.max(0, end - Date.now()));
    }, 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  const total = Math.floor(remaining / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const hourPart = `${h}${t("countdown.unit.hours")} `;
  const label = `${h > 0 ? hourPart : ""}${m}${t("countdown.unit.minutes")} ${s}${t("countdown.unit.seconds")}`;
  return (
    <span className="tabular-nums">
      {remaining > 0 ? label : t("dash.nft.auctions.ended")}
    </span>
  );
}

export function NftDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="nft"
      icon={Gem}
      title={t("dash.nft.title")}
      subtitle={t("dash.nft.subtitle")}
    >
      {(data: NftDashboardPayload) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiTile
              label={t("dash.nft.kpi.floor")}
              kpi={data.kpis.floor}
              format="count"
              unit={data.token}
            />
            <KpiTile
              label={t("dash.nft.kpi.volume")}
              kpi={data.kpis.volume}
              format="count"
              unit={data.token}
            />
            <KpiTile
              label={t("dash.nft.kpi.sales")}
              kpi={data.kpis.sales}
              format="count"
            />
            <KpiTile
              label={t("dash.nft.kpi.wallets")}
              kpi={data.kpis.wallets}
              format="count"
            />
          </div>

          <Panel
            icon={BarChart3}
            title={t("dash.nft.volume.title")}
            description={t("dash.nft.volume.hint")}
          >
            {data.volume.length === 0 ? (
              <EmptyState title={t("table.empty.title")} />
            ) : (
              <CategoryBars
                data={data.volume}
                ariaLabel={t("dash.nft.volume.title")}
                orientation="vertical"
                multiColor={false}
                formatValue={(value) =>
                  `${formatNumber(value, locale)} ${data.token}`
                }
              />
            )}
          </Panel>

          <div className="grid gap-4 xl:grid-cols-3">
            <Panel
              icon={Images}
              title={t("dash.nft.collections.title")}
              description={t("dash.nft.collections.hint")}
            >
              {data.collections.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="divide-y divide-[var(--glass-border)]">
                  {data.collections.map((collection) => (
                    <li
                      key={collection.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <span
                        aria-hidden
                        className="size-9 shrink-0 rounded-lg"
                        style={{
                          background: `var(--chart-${(collection.id % 5) + 1})`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {collection.name}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {t("dash.nft.floorShort")}{" "}
                          {formatNumber(collection.floor, locale)} {data.token}
                        </div>
                      </div>
                      <ChangeTag value={collection.change24h} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel
              icon={Gavel}
              title={t("dash.nft.auctions.title")}
              description={t("dash.nft.auctions.hint")}
            >
              {data.auctions.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <ul className="space-y-2.5">
                  {data.auctions.map((auction) => (
                    <li key={auction.id} className="glass-card rounded-xl p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium">
                          {auction.name}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums">
                          {formatNumber(auction.bid, locale)} {data.token}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>{t("dash.nft.auctions.endsIn")}</span>
                        <Countdown endsAt={auction.endsAt} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel
              icon={Trophy}
              title={t("dash.nft.creators.title")}
              description={t("dash.nft.creators.hint")}
            >
              {data.creators.length === 0 ? (
                <EmptyState title={t("table.empty.title")} />
              ) : (
                <Leaderboard
                  rows={data.creators}
                  format="count"
                  unit={data.token}
                />
              )}
            </Panel>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
