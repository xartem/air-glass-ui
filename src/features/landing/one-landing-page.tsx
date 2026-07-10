import { Link } from "react-router";
import {
  Accessibility,
  ArrowRight,
  Check,
  Languages,
  LayoutGrid,
  MonitorSmartphone,
  Moon,
  Palette,
  Quote,
  Star,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { PricingPlans } from "@/features/pricing/pricing-page";
import { SectionHeading } from "@/features/landing/landing-shared";
import { t } from "@/lib/i18n";
import type { NavIcon } from "@/app/nav";

/*
 * One Page landing (W6, MENU-SPEC §2.3). A fully presentational marketing page rendered
 * inside the public LandingLayout: hero, feature grid, screenshot showcase, pricing (reusing
 * the /pricing tier cards), a testimonials Carousel, an FAQ Accordion and a CTA band. Static
 * content, token-styled, responsive and light/dark. No data flow, no auth.
 */

const FEATURES: { key: string; icon: NavIcon }[] = [
  { key: "responsive", icon: MonitorSmartphone },
  { key: "dark", icon: Moon },
  { key: "i18n", icon: Languages },
  { key: "a11y", icon: Accessibility },
  { key: "screens", icon: LayoutGrid },
  { key: "tokens", icon: Palette },
];

const SCREENS: { key: string; gradient: string }[] = [
  { key: "analytics", gradient: "linear-gradient(135deg, #60a5fa, #a78bfa)" },
  { key: "ecommerce", gradient: "linear-gradient(135deg, #34d399, #22d3ee)" },
  { key: "crm", gradient: "linear-gradient(135deg, #f472b6, #fb923c)" },
];

// Names are proper nouns — kept verbatim across locales; only quote/role are translated.
const TESTIMONIALS: { key: string; name: string }[] = [
  { key: "ava", name: "Ava Reed" },
  { key: "marco", name: "Marco Silva" },
  { key: "lena", name: "Lena Fischer" },
];

const FAQ = ["license", "updates", "support", "tech"];

/** Decorative dashboard mock for the hero — pure chrome, hidden from assistive tech. */
function HeroShot() {
  return (
    <div
      aria-hidden
      className="glass-card w-full overflow-hidden rounded-2xl p-3 shadow-xl"
    >
      <div className="flex gap-3">
        <div className="hidden w-16 shrink-0 space-y-2 sm:block">
          <div className="h-6 rounded-lg bg-primary/20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 rounded-md bg-muted" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-8 rounded-lg bg-muted" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-primary/10" />
            ))}
          </div>
          <div className="h-28 rounded-lg bg-gradient-to-tr from-primary/15 to-primary/5" />
        </div>
      </div>
    </div>
  );
}

export function OneLandingPage() {
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="space-y-6 text-center lg:text-start">
          <Badge
            variant="secondary"
            className="bg-primary/10 text-primary"
          >
            {t("landing.one.hero.badge")}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("landing.one.hero.title")}
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg lg:mx-0">
            {t("landing.one.hero.subtitle")}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
            <Button size="lg" asChild>
              <Link to="/signup">
                {t("landing.one.hero.primary")}
                <ArrowRight />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/">{t("landing.one.hero.secondary")}</Link>
            </Button>
          </div>
        </div>
        <HeroShot />
      </section>

      {/* Features */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.one.features.title")}
          subtitle={t("landing.one.features.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, icon: Icon }) => (
            <div key={key} className="glass-card space-y-3 rounded-2xl p-6">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="font-semibold">
                {t(`landing.one.features.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`landing.one.features.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots / showcase */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.one.screens.title")}
          subtitle={t("landing.one.screens.subtitle")}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {SCREENS.map((screen) => (
            <figure
              key={screen.key}
              className="glass-card overflow-hidden rounded-2xl"
            >
              <div
                className="h-40 w-full"
                style={{ backgroundImage: screen.gradient }}
              />
              <figcaption className="p-4 text-sm font-medium">
                {t(`landing.one.screens.${screen.key}`)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing — reuses the /pricing tier cards */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.one.pricing.title")}
          subtitle={t("landing.one.pricing.subtitle")}
        />
        <PricingPlans />
      </section>

      {/* Testimonials */}
      <section className="space-y-10">
        <SectionHeading title={t("landing.one.testimonials.title")} />
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent>
            {TESTIMONIALS.map((item) => (
              <CarouselItem
                key={item.key}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <figure className="glass-card flex h-full flex-col gap-4 rounded-2xl p-6">
                  <Quote className="size-6 text-primary" />
                  <blockquote className="flex-1 text-sm">
                    {t(`landing.one.testimonials.${item.key}.quote`)}
                  </blockquote>
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <figcaption className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {item.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t(`landing.one.testimonials.${item.key}.role`)}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl space-y-10">
        <SectionHeading title={t("landing.one.faq.title")} />
        <Accordion type="single" collapsible className="w-full">
          {FAQ.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger>
                {t(`landing.one.faq.${key}.q`)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(`landing.one.faq.${key}.a`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA band */}
      <section className="glass-card space-y-5 rounded-3xl p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("landing.one.cta.title")}
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          {t("landing.one.cta.subtitle")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/signup">
              <Check />
              {t("landing.one.cta.button")}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
