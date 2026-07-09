import { useState } from "react";
import { BadgeDollarSign, Check, Minus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * /pricing (build-demo-screen-catalog): a presentational marketing/demo screen —
 * a monthly/annual billing toggle, three tier cards (one highlighted "popular"),
 * and a feature-comparison table below. Plan data is a small local mock; there
 * is no permission gate (any authenticated user), no network call.
 */

type BillingCycle = "monthly" | "annual";
type TierKey = "starter" | "pro" | "enterprise";

interface Tier {
  key: TierKey;
  /** Price per month in each cycle; null → shown as a custom/contact price. */
  price: Record<BillingCycle, number | null>;
  popular?: boolean;
  /** Highlight bullets shown on the card (i18n leaf keys under pricing.tier.<key>.feature.*). */
  highlights: string[];
}

const TIERS: Tier[] = [
  {
    key: "starter",
    price: { monthly: 12, annual: 9 },
    highlights: ["projects", "storage", "members"],
  },
  {
    key: "pro",
    price: { monthly: 32, annual: 26 },
    popular: true,
    highlights: ["projects", "storage", "analytics", "support"],
  },
  {
    key: "enterprise",
    price: { monthly: null, annual: null },
    highlights: ["sso", "audit", "api", "support"],
  },
];

/** Comparison rows: string values are data (sizes/counts), booleans render a check/dash. */
type CellValue = string | boolean;
const COMPARE_ROWS: { key: string; values: Record<TierKey, CellValue> }[] = [
  {
    key: "projects",
    values: { starter: "3", pro: "25", enterprise: "unlimited" },
  },
  {
    key: "storage",
    values: { starter: "10 GB", pro: "100 GB", enterprise: "1 TB" },
  },
  {
    key: "members",
    values: { starter: "1", pro: "10", enterprise: "unlimited" },
  },
  { key: "analytics", values: { starter: false, pro: true, enterprise: true } },
  { key: "support", values: { starter: false, pro: true, enterprise: true } },
  { key: "sso", values: { starter: false, pro: false, enterprise: true } },
  { key: "audit", values: { starter: false, pro: false, enterprise: true } },
  { key: "api", values: { starter: false, pro: true, enterprise: true } },
];

const TIER_ORDER: TierKey[] = ["starter", "pro", "enterprise"];

/** Localized money — pricing is a demo, so a plain USD format keeps it simple and stable. */
function price(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PricingPage() {
  const locale = useLocale();
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  console.debug("[PricingPage] billingCycle", cycle);

  return (
    <div className="space-y-6">
      <PageHeader title={t("pricing.title")} icon={BadgeDollarSign} />

      <div className="flex flex-col items-center gap-3 text-center">
        <p className="max-w-xl text-sm text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={cycle}
            onValueChange={(value) => value && setCycle(value as BillingCycle)}
            variant="outline"
            size="sm"
            aria-label={t("pricing.billing.label")}
          >
            <ToggleGroupItem value="monthly">
              {t("pricing.billing.monthly")}
            </ToggleGroupItem>
            <ToggleGroupItem value="annual">
              {t("pricing.billing.annual")}
            </ToggleGroupItem>
          </ToggleGroup>
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary"
            style={{
              background: "var(--status-success-bg)",
              color: "var(--status-success-fg)",
            }}
          >
            {t("pricing.billing.save")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <PricingCard
            key={tier.key}
            tier={tier}
            cycle={cycle}
            locale={locale}
          />
        ))}
      </div>

      <Panel
        icon={BadgeDollarSign}
        title={t("pricing.compare_title")}
        description={t("pricing.compare_hint")}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-start">
                <th className="py-2 pe-3 font-medium text-muted-foreground">
                  {t("pricing.compare_feature")}
                </th>
                {TIER_ORDER.map((key) => (
                  <th key={key} className="px-3 py-2 text-center font-semibold">
                    {t(`pricing.tier.${key}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="py-2.5 pe-3 text-muted-foreground">
                    {t(`pricing.feature.${row.key}`)}
                  </td>
                  {TIER_ORDER.map((key) => (
                    <td
                      key={key}
                      className="px-3 py-2.5 text-center tabular-nums"
                    >
                      <CompareCell value={row.values[key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function CompareCell({ value }: { value: CellValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check
        className="mx-auto size-4"
        style={{ color: "var(--status-success-fg)" }}
        aria-label={t("pricing.included")}
      />
    ) : (
      <Minus
        className="mx-auto size-4 text-muted-foreground/50"
        aria-label={t("pricing.not_included")}
      />
    );
  }
  if (value === "unlimited") return <span>{t("pricing.value.unlimited")}</span>;
  return <span>{value}</span>;
}

function PricingCard({
  tier,
  cycle,
  locale,
}: {
  tier: Tier;
  cycle: BillingCycle;
  locale: string;
}) {
  const amount = tier.price[cycle];
  return (
    <div
      className={cn(
        "glass-card relative flex flex-col rounded-2xl p-6",
        tier.popular && "ring-2 ring-primary",
      )}
    >
      {tier.popular ? (
        <Badge className="absolute -top-2.5 start-6 bg-primary text-primary-foreground">
          {t("pricing.popular")}
        </Badge>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight">
        {t(`pricing.tier.${tier.key}.name`)}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(`pricing.tier.${tier.key}.desc`)}
      </p>

      <div className="mt-4 flex items-baseline gap-1">
        {amount === null ? (
          <span className="text-3xl font-semibold tracking-tight">
            {t("pricing.custom")}
          </span>
        ) : (
          <>
            <span className="text-4xl font-semibold tracking-tight tabular-nums">
              {price(amount, locale)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("pricing.per_month")}
            </span>
          </>
        )}
      </div>
      <p className="mt-1 h-4 text-xs text-muted-foreground">
        {amount !== null && cycle === "annual"
          ? t("pricing.billed_annually")
          : ""}
      </p>

      <ul className="mt-5 space-y-2.5 text-sm">
        {tier.highlights.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check
              className="mt-0.5 size-4 shrink-0"
              style={{ color: "var(--status-success-fg)" }}
            />
            <span>{t(`pricing.feature.${feature}`)}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-6 w-full"
        variant={tier.popular ? "default" : "outline"}
      >
        {tier.key === "enterprise"
          ? t("pricing.cta_contact")
          : t("pricing.cta")}
      </Button>
    </div>
  );
}
