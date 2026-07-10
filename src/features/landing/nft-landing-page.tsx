import { Link } from "react-router";
import { ArrowRight, ListPlus, Tag, Wallet, Wand2 } from "lucide-react";

import { type NftGradient } from "@/api";
import { Button } from "@/components/ui/button";
import { NftArt, formatEth } from "@/features/nft/nft-shared";
import { SectionHeading, StatBand } from "@/features/landing/landing-shared";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import type { NavIcon } from "@/app/nav";

/*
 * NFT landing (W6, MENU-SPEC §2.3). Presentational marketing page on the shared LandingLayout,
 * reusing the NFT slice's generated gradient art (no external hosts) and the ETH formatter.
 * Static fixtures — collection/creator names are proper nouns kept verbatim across locales;
 * only the surrounding chrome is translated.
 */

const COLLECTIONS: {
  name: string;
  gradient: NftGradient;
  seed: number;
  floor: number;
}[] = [
  { name: "Aurora Drifts", gradient: ["#60a5fa", "#a78bfa"], seed: 7, floor: 1.24 },
  { name: "Neon Koi", gradient: ["#f472b6", "#fb923c"], seed: 13, floor: 0.86 },
  { name: "Glass Relics", gradient: ["#34d399", "#22d3ee"], seed: 21, floor: 2.4 },
  { name: "Pixel Nomads", gradient: ["#818cf8", "#22d3ee"], seed: 4, floor: 0.52 },
];

const CREATORS: { name: string; gradient: NftGradient; sales: number }[] = [
  { name: "Nova Lin", gradient: ["#f472b6", "#fb923c"], sales: 128 },
  { name: "Kai Rivera", gradient: ["#60a5fa", "#a78bfa"], sales: 96 },
  { name: "Mara Cole", gradient: ["#34d399", "#22d3ee"], sales: 74 },
  { name: "Idris Vale", gradient: ["#818cf8", "#f472b6"], sales: 61 },
];

const STEPS: { key: string; icon: NavIcon }[] = [
  { key: "wallet", icon: Wallet },
  { key: "create", icon: Wand2 },
  { key: "list", icon: ListPlus },
  { key: "sell", icon: Tag },
];

export function NftLandingPage() {
  const locale = useLocale();
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6 text-center lg:text-start">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("landing.nft.hero.title")}
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
            {t("landing.nft.hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" asChild>
              <Link to="/signup">
                {t("landing.nft.hero.primary")}
                <ArrowRight className="rtl:-scale-x-100" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/landing">{t("landing.nft.hero.secondary")}</Link>
            </Button>
          </div>
        </div>
        <div className="glass-card overflow-hidden rounded-3xl p-3 shadow-xl">
          <div className="aspect-square overflow-hidden rounded-2xl">
            <NftArt
              gradient={["#818cf8", "#f472b6"]}
              seed={42}
              alt={t("landing.nft.hero.art")}
            />
          </div>
        </div>
      </section>

      {/* Trending collections */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.nft.collections.title")}
          subtitle={t("landing.nft.collections.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTIONS.map((collection) => (
            <div
              key={collection.name}
              className="glass-card overflow-hidden rounded-2xl"
            >
              <div className="aspect-square overflow-hidden">
                <NftArt
                  gradient={collection.gradient}
                  seed={collection.seed}
                  alt={collection.name}
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <span className="min-w-0 truncate text-sm font-medium">
                  {collection.name}
                </span>
                <span className="shrink-0 text-end">
                  <span className="block text-[11px] text-muted-foreground">
                    {t("landing.nft.collections.floor")}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatEth(collection.floor, "ETH", locale)}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top creators */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.nft.creators.title")}
          subtitle={t("landing.nft.creators.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREATORS.map((creator) => (
            <div
              key={creator.name}
              className="glass-card flex items-center gap-3 rounded-2xl p-4"
            >
              <span
                aria-hidden
                className="size-11 shrink-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${creator.gradient[0]}, ${creator.gradient[1]})`,
                }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {creator.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("landing.nft.creators.sales")}:{" "}
                  {formatEth(creator.sales, "ETH", locale)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.nft.steps.title")}
          subtitle={t("landing.nft.steps.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ key, icon: Icon }, index) => (
            <div key={key} className="glass-card space-y-3 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="text-2xl font-semibold text-muted-foreground/40 tabular-nums">
                  {index + 1}
                </span>
              </div>
              <h3 className="font-semibold">
                {t(`landing.nft.steps.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`landing.nft.steps.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats band */}
      <StatBand
        stats={[
          { value: "48K", label: t("landing.nft.stats.volume") },
          { value: "12.3K", label: t("landing.nft.stats.items") },
          { value: "3.1K", label: t("landing.nft.stats.creators") },
          { value: "420", label: t("landing.nft.stats.collections") },
        ]}
      />

      {/* CTA */}
      <section className="glass-card space-y-5 rounded-3xl p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("landing.nft.cta.title")}
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          {t("landing.nft.cta.subtitle")}
        </p>
        <Button size="lg" asChild>
          <Link to="/signup">
            {t("landing.nft.cta.button")}
            <ArrowRight className="rtl:-scale-x-100" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
