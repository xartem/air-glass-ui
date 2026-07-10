import { useState } from "react";
import {
  ArrowLeftRight,
  Bitcoin,
  CandlestickChart,
  Coins,
  LayoutGrid,
  Star,
} from "lucide-react";

import type { CryptoDashboardPayload } from "@/api";
import { EmptyState } from "@/components/empty-state";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { useLocale } from "@/lib/use-locale";
import { DashboardShell } from "./dashboard-shell";
import { Candlestick } from "@/components/charts/candlestick";
import { Sparkline } from "@/components/charts/sparkline";
import { MarketTreemap } from "@/components/charts/treemap";
import { ChangeTag, KpiTile } from "./widgets";
import { devDebug } from "@/lib/debug";

/*
 * Crypto dashboard: portfolio + market snapshot for a period. Portfolio value,
 * per-coin sparklines, a market-cap treemap and a candlestick for the selected
 * pair, plus recent buy/sell activity and a watchlist.
 */

export function CryptoDashboardPage() {
  const locale = useLocale();

  return (
    <DashboardShell
      vertical="crypto"
      icon={Bitcoin}
      title={t("dash.crypto.title")}
      subtitle={t("dash.crypto.subtitle")}
    >
      {(data: CryptoDashboardPayload) => (
        <CryptoBody data={data} locale={locale} />
      )}
    </DashboardShell>
  );
}

function CryptoBody({
  data,
  locale,
}: {
  data: CryptoDashboardPayload;
  locale: ReturnType<typeof useLocale>;
}) {
  const [selectedId, setSelectedId] = useState(data.coins[0]?.id ?? "");
  const selected =
    data.coins.find((coin) => coin.id === selectedId) ?? data.coins[0];
  const base = data.coins[0]?.price || 1;
  const factor = selected ? selected.price / base : 1;
  const scaledOhlc = data.ohlc.map((point) => ({
    label: point.label,
    open: point.open * factor,
    high: point.high * factor,
    low: point.low * factor,
    close: point.close * factor,
  }));
  const money = (value: number) => formatMoney(value, data.currency, locale);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card rounded-2xl p-4 sm:col-span-2 xl:col-span-1">
          <div className="text-xs text-muted-foreground">
            {t("dash.crypto.portfolio")}
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {money(data.portfolio.value)}
          </div>
          <div className="mt-1.5">
            <ChangeTag value={data.portfolio.delta} />
          </div>
        </div>
        <KpiTile
          label={t("dash.crypto.kpi.assets")}
          kpi={{ value: data.coins.length, delta: 0 }}
          format="count"
        />
        <KpiTile
          label={t("dash.crypto.kpi.bestDay")}
          kpi={{
            value: Math.max(...data.coins.map((c) => c.change24h)),
            delta: 0,
          }}
          format="percent"
        />
        <KpiTile
          label={t("dash.crypto.kpi.marketCap")}
          kpi={{
            value:
              data.marketCap.reduce((sum, row) => sum + row.value, 0) *
              1_000_000,
            delta: 0,
          }}
          format="compactMoney"
          currency={data.currency}
        />
      </div>

      <Panel
        icon={Coins}
        title={t("dash.crypto.coins.title")}
        description={t("dash.crypto.coins.hint")}
      >
        {data.coins.length === 0 ? (
          <EmptyState title={t("table.empty.title")} />
        ) : (
          <ul className="divide-y divide-[var(--glass-border)]">
            {data.coins.map((coin) => {
              const up = coin.change24h >= 0;
              return (
                <li key={coin.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(coin.id);
                      devDebug("[cryptoDashboard] pair", `${coin.symbol}/USD`);
                    }}
                    aria-pressed={coin.id === selectedId}
                    className={cn(
                      "flex w-full items-center gap-3 py-2.5 text-start transition-colors hover:bg-muted/40",
                      coin.id === selectedId && "bg-muted/40",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {coin.name}{" "}
                        <span className="text-muted-foreground">
                          {coin.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {money(coin.price)}
                      </div>
                    </div>
                    <Sparkline
                      data={coin.spark}
                      color={
                        up
                          ? "var(--status-success-fg)"
                          : "var(--status-error-fg)"
                      }
                      ariaLabel={`${coin.symbol} ${t("dash.crypto.coins.title")}`}
                    />
                    <ChangeTag value={coin.change24h} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          icon={LayoutGrid}
          title={t("dash.crypto.market.title")}
          description={t("dash.crypto.market.hint")}
        >
          {data.marketCap.length === 0 ? (
            <EmptyState title={t("table.empty.title")} />
          ) : (
            <MarketTreemap
              data={data.marketCap}
              ariaLabel={t("dash.crypto.market.title")}
            />
          )}
        </Panel>
        <Panel
          icon={CandlestickChart}
          title={t("dash.crypto.candles.title")}
          description={
            selected ? `${selected.symbol}/USD` : t("dash.crypto.candles.hint")
          }
        >
          {scaledOhlc.length === 0 ? (
            <EmptyState title={t("table.empty.title")} />
          ) : (
            <Candlestick
              data={scaledOhlc}
              ariaLabel={t("dash.crypto.candles.title")}
              formatValue={money}
            />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          icon={ArrowLeftRight}
          title={t("dash.crypto.activity.title")}
          description={t("dash.crypto.activity.hint")}
        >
          {data.activity.length === 0 ? (
            <EmptyState title={t("table.empty.title")} />
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {data.activity.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      entry.side === "sell" &&
                        "bg-destructive/10 text-destructive",
                    )}
                    style={
                      entry.side === "buy"
                        ? {
                            background: "var(--status-success-bg)",
                            color: "var(--status-success-fg)",
                          }
                        : undefined
                    }
                  >
                    {t(`dash.crypto.side.${entry.side}`)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {entry.asset}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {entry.amount}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {new Date(entry.at).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          icon={Star}
          title={t("dash.crypto.watchlist.title")}
          description={t("dash.crypto.watchlist.hint")}
        >
          {data.watchlist.length === 0 ? (
            <EmptyState title={t("table.empty.title")} />
          ) : (
            <ul className="divide-y divide-[var(--glass-border)]">
              {data.watchlist.map((coin) => (
                <li
                  key={coin.symbol}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {coin.symbol}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {coin.name}
                    </div>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums">
                    {money(coin.price)}
                  </span>
                  <ChangeTag value={coin.change24h} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
