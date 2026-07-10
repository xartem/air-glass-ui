import type { OhlcPoint } from "@/api";
import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Candlestick } from "@/components/charts/candlestick";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Candlestick showcase (W5): OHLC price bars composed with the shared
 * Candlestick — up/down bodies use the --status-* tokens, on a --chart tokened
 * grid. A weekly and an intraday sample series.
 */

const WEEKLY: OhlcPoint[] = [
  { label: "Mon", open: 132, high: 141, low: 129, close: 138 },
  { label: "Tue", open: 138, high: 145, low: 135, close: 134 },
  { label: "Wed", open: 134, high: 137, low: 126, close: 130 },
  { label: "Thu", open: 130, high: 148, low: 130, close: 146 },
  { label: "Fri", open: 146, high: 152, low: 143, close: 151 },
  { label: "Sat", open: 151, high: 154, low: 147, close: 149 },
  { label: "Sun", open: 149, high: 158, low: 148, close: 157 },
];

const INTRADAY: OhlcPoint[] = [
  { label: "09:00", open: 62, high: 65, low: 61, close: 64 },
  { label: "10:00", open: 64, high: 64, low: 58, close: 59 },
  { label: "11:00", open: 59, high: 63, low: 59, close: 62 },
  { label: "12:00", open: 62, high: 68, low: 62, close: 67 },
  { label: "13:00", open: 67, high: 69, low: 64, close: 65 },
  { label: "14:00", open: 65, high: 66, low: 60, close: 61 },
];

export function ChartsCandlestickPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.candlestick.title")}
      description={t("showcase.charts.candlestick.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.candlestick.weekly")}
        previewClassName="block"
        code={`<Candlestick
  data={ohlc}
  ariaLabel="Weekly price"
  formatValue={(value) => \`$\${value}\`}
/>`}
      >
        <Candlestick
          data={WEEKLY}
          ariaLabel={t("showcase.charts.candlestick.title")}
          formatValue={(value) => `$${value}`}
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.candlestick.intraday")}
        previewClassName="block"
        code={`<Candlestick
  data={ohlc}
  ariaLabel="Intraday price"
  formatValue={(value) => \`$\${value}\`}
/>`}
      >
        <Candlestick
          data={INTRADAY}
          ariaLabel={t("showcase.charts.candlestick.title")}
          formatValue={(value) => `$${value}`}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
