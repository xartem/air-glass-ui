import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, LineChart } from "lucide-react";
import { toast } from "sonner";

import { api, type CryptoMarket } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendChart } from "@/features/dashboards/charts/trend-chart";
import { formatMoney, formatNumber } from "@/lib/money";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * /crypto/buy-sell — a trade ticket beside a market snapshot: pick a coin, an
 * amount and a side, review the live quote and fees, then confirm. Reachable
 * with crypto.view.
 */

export function CryptoBuySellPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [symbol, setSymbol] = useState("BTC");
  const [amount, setAmount] = useState<number>(0);

  const marketsQuery = useQuery({
    queryKey: ["crypto", "markets"],
    queryFn: api.crypto.markets,
  });
  const walletQuery = useQuery({
    queryKey: ["crypto", "wallet"],
    queryFn: api.crypto.wallet,
  });

  const markets = marketsQuery.data ?? [];
  const market = markets.find((entry) => entry.symbol === symbol) ?? markets[0];
  const pair = market ? `${market.symbol}/USD` : "";

  const quoteQuery = useQuery({
    queryKey: ["crypto", "quote", pair, amount],
    queryFn: () => api.crypto.quote(pair, amount),
    enabled: amount > 0 && Boolean(pair),
  });

  const holding = walletQuery.data?.holdings.find(
    (entry) => entry.symbol === symbol,
  );
  const balance =
    side === "sell"
      ? (holding?.amount ?? 0)
      : (walletQuery.data?.total_value ?? 0);

  const overBalance =
    side === "sell"
      ? amount > (holding?.amount ?? 0)
      : (quoteQuery.data?.total ?? 0) > (walletQuery.data?.total_value ?? 0);
  const invalid = !(amount > 0) || overBalance;

  const tradeMutation = useMutation({
    mutationFn: () => {
      console.debug("[CryptoBuySell] trade", { pair, side, amount });
      return api.crypto.trade({ pair, side, amount });
    },
    onSuccess: () => {
      toast.success(t("crypto.trade.placed"));
      setAmount(0);
      void queryClient.invalidateQueries({ queryKey: ["crypto", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["crypto", "wallet"] });
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t("crypto.trade.title")} icon={ArrowUpDown} />

      <div className="grid items-start gap-4 lg:grid-cols-[24rem_1fr]">
        <Panel title={t("crypto.trade.ticket")}>
          <div className="space-y-4">
            <Tabs
              value={side}
              onValueChange={(value) => setSide(value as "buy" | "sell")}
            >
              <TabsList className="w-full">
                <TabsTrigger value="buy" className="flex-1">
                  {t("crypto.type.buy")}
                </TabsTrigger>
                <TabsTrigger value="sell" className="flex-1">
                  {t("crypto.type.sell")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="coin">
                {t("crypto.trade.coin")}
              </label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger id="coin" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((entry) => (
                    <SelectItem key={entry.symbol} value={entry.symbol}>
                      {entry.name} ({entry.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="amount">
                {t("crypto.trade.amount")}
              </label>
              <NumberField
                id="amount"
                min={0}
                step={0.01}
                value={amount}
                onValueChange={(value) => setAmount(value ?? 0)}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {market
                    ? `≈ ${formatMoney(amount * market.price, "USD", locale)}`
                    : "—"}
                </span>
                <span>
                  {t("crypto.trade.balance")}:{" "}
                  <span className="tabular-nums">
                    {side === "sell"
                      ? `${formatNumber(balance, locale)} ${symbol}`
                      : formatMoney(balance, "USD", locale)}
                  </span>
                </span>
              </div>
              {overBalance ? (
                <p className="text-xs text-destructive">
                  {t("crypto.trade.error.balance")}
                </p>
              ) : null}
            </div>

            <PriceTicker market={market} locale={locale} />

            <Separator />

            <dl className="space-y-2 text-sm">
              <FeeRow
                label={t("crypto.trade.subtotal")}
                value={
                  quoteQuery.data
                    ? formatMoney(
                        quoteQuery.data.subtotal,
                        quoteQuery.data.currency,
                        locale,
                      )
                    : "—"
                }
                loading={quoteQuery.isFetching && amount > 0}
              />
              <FeeRow
                label={t("crypto.trade.fee")}
                value={
                  quoteQuery.data
                    ? formatMoney(
                        quoteQuery.data.fee,
                        quoteQuery.data.currency,
                        locale,
                      )
                    : "—"
                }
                loading={quoteQuery.isFetching && amount > 0}
              />
              <Separator />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>{t("crypto.trade.total")}</span>
                <span className="tabular-nums">
                  {quoteQuery.data
                    ? formatMoney(
                        quoteQuery.data.total,
                        quoteQuery.data.currency,
                        locale,
                      )
                    : "—"}
                </span>
              </div>
            </dl>

            <Button
              className="w-full"
              disabled={invalid || tradeMutation.isPending}
              onClick={() => tradeMutation.mutate()}
            >
              {side === "buy"
                ? t("crypto.trade.confirm_buy", { coin: symbol })
                : t("crypto.trade.confirm_sell", { coin: symbol })}
            </Button>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            icon={LineChart}
            title={t("crypto.trade.chart_title", { pair })}
            description={t("crypto.trade.chart_hint")}
          >
            {market ? (
              <TrendChart
                data={market.spark.map((price, index) => ({
                  label: `${index}h`,
                  price,
                }))}
                seriesList={[
                  {
                    key: "price",
                    label: pair,
                    color: "var(--chart-1)",
                  },
                ]}
                variant="area"
                ariaLabel={t("crypto.trade.chart_title", { pair })}
                formatValue={(value) => formatMoney(value, "USD", locale)}
              />
            ) : (
              <Skeleton className="h-64" />
            )}
          </Panel>

          <Panel title={t("crypto.trade.orderbook")}>
            {market ? (
              <OrderBook market={market} locale={locale} />
            ) : (
              <Skeleton className="h-40" />
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function PriceTicker({
  market,
  locale,
}: {
  market: CryptoMarket | undefined;
  locale: ReturnType<typeof useLocale>;
}) {
  if (!market) return <Skeleton className="h-12" />;
  const up = market.change24h >= 0;
  return (
    <div className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-2">
      <div>
        <div className="text-xs text-muted-foreground">
          {t("crypto.trade.live_price")}
        </div>
        <div className="text-lg font-semibold tabular-nums">
          {formatMoney(market.price, market.currency, locale)}
        </div>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-xs font-medium tabular-nums"
        style={{
          color: up ? "var(--status-success-fg)" : "var(--status-error-fg)",
          background: up
            ? "var(--status-success-bg)"
            : "var(--status-error-bg)",
        }}
      >
        {up ? "+" : ""}
        {market.change24h.toFixed(2)}%
      </span>
    </div>
  );
}

function OrderBook({
  market,
  locale,
}: {
  market: CryptoMarket;
  locale: ReturnType<typeof useLocale>;
}) {
  const rows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const offset = (index + 1) * 0.0009;
        return {
          bid: market.price * (1 - offset),
          ask: market.price * (1 + offset),
          size: Number(((index + 1) * 0.42).toFixed(2)),
        };
      }),
    [market.price],
  );
  return (
    <div className="grid grid-cols-2 gap-x-6 text-sm">
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {t("crypto.trade.bids")}
        </div>
        <ul className="space-y-1">
          {rows.map((row, index) => (
            <li key={index} className="flex justify-between tabular-nums">
              <span style={{ color: "var(--status-success-fg)" }}>
                {formatMoney(row.bid, market.currency, locale)}
              </span>
              <span className="text-muted-foreground">{row.size}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          {t("crypto.trade.asks")}
        </div>
        <ul className="space-y-1">
          {rows.map((row, index) => (
            <li key={index} className="flex justify-between tabular-nums">
              <span style={{ color: "var(--status-error-fg)" }}>
                {formatMoney(row.ask, market.currency, locale)}
              </span>
              <span className="text-muted-foreground">{row.size}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FeeRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span
        className={cn("tabular-nums text-foreground", loading && "opacity-40")}
      >
        {loading ? t("common.loading") : value}
      </span>
    </div>
  );
}
