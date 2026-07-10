import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { MarketTreemap } from "@/components/charts/treemap";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Treemap showcase (W5): the shared MarketTreemap composition (Recharts Treemap
 * with a token-filled custom tile). Tiles cycle the --chart-* palette; area
 * encodes each item's share of the whole.
 */

const MARKET_CAP = [
  { label: "Bitcoin", value: 1320 },
  { label: "Ethereum", value: 410 },
  { label: "Solana", value: 96 },
  { label: "XRP", value: 78 },
  { label: "Cardano", value: 54 },
  { label: "Dogecoin", value: 32 },
  { label: "Polkadot", value: 21 },
];

const STORAGE = [
  { label: "Media", value: 420 },
  { label: "Documents", value: 180 },
  { label: "Backups", value: 140 },
  { label: "Apps", value: 96 },
  { label: "Cache", value: 44 },
];

export function ChartsTreemapPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.treemap.title")}
      description={t("showcase.charts.treemap.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.s.marketCap")}
        previewClassName="block"
        code={`<MarketTreemap
  data={marketCap}
  ariaLabel="Market cap by coin"
/>`}
      >
        <MarketTreemap
          data={MARKET_CAP}
          ariaLabel={t("showcase.charts.s.marketCap")}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.s.categories")}
        previewClassName="block"
        code={`<MarketTreemap
  data={storage}
  ariaLabel="Storage by category"
/>`}
      >
        <MarketTreemap
          data={STORAGE}
          ariaLabel={t("showcase.charts.s.categories")}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
