import { Link } from "react-router";
import {
  ArrowRight,
  Briefcase,
  Code2,
  FileText,
  LifeBuoy,
  MapPin,
  Megaphone,
  Palette,
  Search,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { type JobDepartment, type JobGradient, type JobType } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GradientAvatar,
  formatSalaryRange,
} from "@/features/jobs/jobs-shared";
import { SectionHeading, StatBand } from "@/features/landing/landing-shared";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import type { NavIcon } from "@/app/nav";

/*
 * Job landing (W6, MENU-SPEC §2.3). Presentational job-board marketing page on the shared
 * LandingLayout, reusing the Jobs slice's gradient avatars, department/type labels and salary
 * formatter. Static fixtures — company/location names are proper nouns kept verbatim; the
 * hero search bar is decorative (no data flow).
 */

const FEATURED: {
  title: string;
  company: string;
  gradient: JobGradient;
  location: string;
  type: JobType;
  min: number;
  max: number;
}[] = [
  {
    title: "Senior Frontend Engineer",
    company: "Nimbus Labs",
    gradient: ["#60a5fa", "#a78bfa"],
    location: "Remote",
    type: "full_time",
    min: 90000,
    max: 130000,
  },
  {
    title: "Product Designer",
    company: "Halcyon",
    gradient: ["#f472b6", "#fb923c"],
    location: "Berlin",
    type: "full_time",
    min: 70000,
    max: 100000,
  },
  {
    title: "Growth Marketer",
    company: "Orbit",
    gradient: ["#34d399", "#22d3ee"],
    location: "Lisbon",
    type: "contract",
    min: 55000,
    max: 80000,
  },
];

const CATEGORIES: { key: JobDepartment; icon: NavIcon; count: number }[] = [
  { key: "engineering", icon: Code2, count: 128 },
  { key: "sales", icon: TrendingUp, count: 64 },
  { key: "marketing", icon: Megaphone, count: 42 },
  { key: "design", icon: Palette, count: 37 },
  { key: "support", icon: LifeBuoy, count: 25 },
];

const EMPLOYERS: { name: string; gradient: JobGradient; roles: number }[] = [
  { name: "Nimbus Labs", gradient: ["#60a5fa", "#a78bfa"], roles: 12 },
  { name: "Halcyon", gradient: ["#f472b6", "#fb923c"], roles: 8 },
  { name: "Orbit", gradient: ["#34d399", "#22d3ee"], roles: 6 },
  { name: "Vantage", gradient: ["#818cf8", "#f472b6"], roles: 5 },
];

const STEPS: { key: string; icon: NavIcon }[] = [
  { key: "search", icon: Search },
  { key: "apply", icon: FileText },
  { key: "interview", icon: UserCheck },
  { key: "hired", icon: Briefcase },
];

export function JobLandingPage() {
  const locale = useLocale();
  return (
    <div className="space-y-20 sm:space-y-28">
      {/* Hero + search */}
      <section className="space-y-8 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            {t("landing.job.hero.title")}
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            {t("landing.job.hero.subtitle")}
          </p>
        </div>
        {/* Decorative search — presentational only, no submission. */}
        <form
          className="glass-card mx-auto flex max-w-xl flex-col gap-2 rounded-2xl p-2 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label={t("landing.job.hero.search")}
              placeholder={t("landing.job.hero.search")}
              className="ps-9"
            />
          </div>
          <Button type="submit">{t("landing.job.hero.searchButton")}</Button>
        </form>
      </section>

      {/* Featured jobs */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.job.featured.title")}
          subtitle={t("landing.job.featured.subtitle")}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {FEATURED.map((job) => (
            <div
              key={job.title}
              className="glass-card flex flex-col gap-4 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3">
                <GradientAvatar
                  gradient={job.gradient}
                  name={job.company}
                  className="size-11"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{job.title}</h3>
                  <p className="truncate text-sm text-muted-foreground">
                    {job.company}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {job.location}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5">
                  {t(`jobs.type.${job.type}`)}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {formatSalaryRange(job.min, job.max, "USD", locale)}
                </span>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/signup">{t("landing.job.featured.apply")}</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.job.categories.title")}
          subtitle={t("landing.job.categories.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map(({ key, icon: Icon, count }) => (
            <div
              key={key}
              className="glass-card flex flex-col items-center gap-2 rounded-2xl p-6 text-center"
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{t(`jobs.dept.${key}`)}</span>
              <span className="text-xs text-muted-foreground">
                {t("landing.job.categories.count", { count })}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Top employers */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.job.employers.title")}
          subtitle={t("landing.job.employers.subtitle")}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EMPLOYERS.map((employer) => (
            <div
              key={employer.name}
              className="glass-card flex items-center gap-3 rounded-2xl p-4"
            >
              <GradientAvatar
                gradient={employer.gradient}
                name={employer.name}
                className="size-11"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {employer.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {t("landing.job.employers.roles", { count: employer.roles })}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-10">
        <SectionHeading
          title={t("landing.job.steps.title")}
          subtitle={t("landing.job.steps.subtitle")}
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
                {t(`landing.job.steps.${key}.title`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t(`landing.job.steps.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <StatBand
        stats={[
          { value: "9.2K", label: t("landing.job.stats.jobs") },
          { value: "1.4K", label: t("landing.job.stats.companies") },
          { value: "76K", label: t("landing.job.stats.candidates") },
          { value: "88%", label: t("landing.job.stats.placed") },
        ]}
      />

      {/* CTA */}
      <section className="glass-card space-y-5 rounded-3xl p-8 text-center sm:p-12">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("landing.job.cta.title")}
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          {t("landing.job.cta.subtitle")}
        </p>
        <Button size="lg" asChild>
          <Link to="/signup">
            {t("landing.job.cta.button")}
            <ArrowRight className="rtl:-scale-x-100" />
          </Link>
        </Button>
      </section>
    </div>
  );
}
