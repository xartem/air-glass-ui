import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * Public landing layout (W6, MENU-SPEC §2.3). A marketing chrome — own header + footer,
 * NO sidebar and NO auth guard — sitting outside the authenticated shell (sibling of the
 * PublicLayout status/error/legal group). Fully presentational and token-styled: the mesh
 * backdrop is painted here so every landing page inherits it. Light + dark; the header
 * carries its own theme toggle since there is no shell to host one.
 */

const THEME_KEY = "admin.theme";

/** Same dark-mode source of truth as the shell (`admin.theme`), so a visit stays consistent. */
function useLandingDark() {
  const [dark, setDark] = useState(
    () => localStorage.getItem(THEME_KEY) === "dark",
  );
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);
  return { dark, toggle: () => setDark((value) => !value) };
}

const NAV_LINKS: { to: string; label: string }[] = [
  { to: "/landing", label: "landing.nav.one" },
  { to: "/landing/nft", label: "landing.nav.nft" },
  { to: "/landing/job", label: "landing.nav.job" },
];

function LandingBrand() {
  return (
    <Link to="/landing" className="flex items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
        U
      </span>
      <span className="text-sm font-semibold">{t("shell.brand")}</span>
    </Link>
  );
}

function LandingHeader() {
  const { dark, toggle } = useLandingDark();
  return (
    <header className="glass-header sticky top-2 z-20 mx-2 mt-2 flex items-center gap-3 rounded-2xl border p-2 sm:top-4 sm:mx-4 sm:mt-4 sm:gap-4 sm:p-3">
      <LandingBrand />
      <nav
        aria-label={t("landing.nav.label")}
        className="ms-2 hidden items-center gap-1 md:flex"
      >
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end
            className={({ isActive }) =>
              cn(
                "rounded-lg px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "nav-item-active font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {t(link.label)}
          </NavLink>
        ))}
      </nav>
      <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={t("landing.theme")}
        >
          {dark ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="sm" className="max-sm:hidden" asChild>
          <Link to="/login">{t("landing.cta.signin")}</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/signup">{t("landing.cta.getStarted")}</Link>
        </Button>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { heading: string; links: { label: string; to: string }[] }[] =
  [
    {
      heading: "landing.footer.product",
      links: [
        { label: "landing.nav.one", to: "/landing" },
        { label: "landing.nav.nft", to: "/landing/nft" },
        { label: "landing.nav.job", to: "/landing/job" },
      ],
    },
    {
      heading: "landing.footer.company",
      links: [
        { label: "landing.cta.signin", to: "/login" },
        { label: "landing.cta.getStarted", to: "/signup" },
      ],
    },
    {
      heading: "landing.footer.legal",
      links: [
        { label: "landing.footer.privacy", to: "/privacy" },
        { label: "landing.footer.terms", to: "/terms" },
      ],
    },
  ];

function LandingFooter() {
  return (
    <footer className="glass-panel mx-2 mt-8 mb-2 rounded-2xl border p-6 sm:mx-4 sm:mb-4 sm:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:justify-between">
        <div className="max-w-xs space-y-3">
          <LandingBrand />
          <p className="text-sm text-muted-foreground">
            {t("landing.footer.tagline")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading} className="space-y-2">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {t(column.heading)}
              </p>
              <ul className="space-y-1.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 border-t border-[var(--glass-border)] pt-4 text-xs text-muted-foreground">
        {t("landing.footer.rights", { year: "2026" })}
      </div>
    </footer>
  );
}

export function LandingLayout() {
  useLocale();
  return (
    <div className="relative min-h-svh">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <LandingHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
}
