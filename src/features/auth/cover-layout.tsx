import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Outlet } from "react-router";

import { devDebug } from "@/lib/debug";
import { ADMIN_LOCALES, setLocale, t, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Split-screen guest wrapper: form column on the start side (max-w-sm), a
 * branded hero panel on the end side (hidden below lg). It consumes the same
 * form children as guest-layout, so every "*-cover" auth route reuses the
 * existing forms without change.
 */

const GUEST_LOCALE_APPLIED = "admin.guest_locale_applied";

function detectBrowserLocale(): AdminLocale | null {
  for (const language of navigator.languages ?? [navigator.language]) {
    const code = language.slice(0, 2).toLowerCase() as AdminLocale;
    if (ADMIN_LOCALES.includes(code)) return code;
  }
  return null;
}

export function CoverLayout() {
  useLocale();

  useEffect(() => {
    devDebug("[CoverLayout] render");
    if (
      localStorage.getItem("admin.ui_locale") ||
      sessionStorage.getItem(GUEST_LOCALE_APPLIED)
    )
      return;
    const detected = detectBrowserLocale();
    if (detected) setLocale(detected);
    sessionStorage.setItem(GUEST_LOCALE_APPLIED, "1");
  }, []);

  return (
    <div className="relative flex min-h-svh">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />

      <div className="flex w-full flex-col items-center justify-center p-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

      <aside className="glass-card relative hidden w-1/2 flex-col justify-between overflow-hidden rounded-none p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            {t("shell.brand")}
          </span>
        </div>
        <div className="space-y-3">
          <h2 className="bg-[image:var(--gradient-heading)] bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            {t("auth.cover.tagline")}
          </h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {t("auth.cover.subtitle")}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("auth.cover.footer")}
        </p>
      </aside>
    </div>
  );
}
