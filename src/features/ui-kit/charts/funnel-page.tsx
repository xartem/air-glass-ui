import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Funnel } from "@/components/charts/funnel";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Funnel chart showcase (W5): stage-to-stage drop-off drawn with the shared
 * Funnel — each step is a token-filled bar (cycling --chart-* colours) scaled to
 * the widest step, with a per-step conversion percentage.
 */

const PIPELINE = [
  { label: "Visited", value: 8400 },
  { label: "Signed up", value: 4200 },
  { label: "Activated", value: 2600 },
  { label: "Subscribed", value: 1400 },
  { label: "Renewed", value: 900 },
];

const CHECKOUT = [
  { label: "Cart", value: 3200 },
  { label: "Checkout", value: 2100 },
  { label: "Payment", value: 1500 },
  { label: "Purchased", value: 1180 },
];

export function ChartsFunnelPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.charts.funnel.title")}
      description={t("showcase.charts.funnel.desc")}
      breadcrumb={{ group: t("nav.components.charts") }}
    >
      <ComponentDemo
        title={t("showcase.charts.funnel.lifecycle")}
        previewClassName="block"
        code={`<Funnel
  steps={[
    { label: "Visited", value: 8400 },
    { label: "Signed up", value: 4200 },
    { label: "Activated", value: 2600 },
  ]}
/>`}
      >
        <div className="w-full">
          <Funnel steps={PIPELINE} />
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.charts.funnel.checkout")}
        previewClassName="block"
        code={`<Funnel
  steps={steps}
  formatValue={(value) => value.toLocaleString()}
/>`}
      >
        <div className="w-full">
          <Funnel
            steps={CHECKOUT}
            formatValue={(value) => value.toLocaleString()}
          />
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
