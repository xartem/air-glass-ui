import { useEffect } from "react";
import { Outlet } from "react-router";

import { ADMIN_LOCALES, setLocale, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Guest screens layout (UI:shell-auth §2): full-viewport mesh with one centered
 * glass card — no sidebar/topbar. Guest language is auto-detected from the
 * browser across the 8 starter locales (C1 §1); after login the profile
 * ui_locale takes over.
 */

const GUEST_LOCALE_APPLIED = "admin.guest_locale_applied";

function detectBrowserLocale(): AdminLocale | null {
  for (const language of navigator.languages ?? [navigator.language]) {
    const code = language.slice(0, 2).toLowerCase() as AdminLocale;
    if (ADMIN_LOCALES.includes(code)) return code;
  }
  return null;
}

export function GuestLayout() {
  useLocale();

  useEffect(() => {
    // Only before the user ever picked a language explicitly.
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
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div
        aria-hidden
        className="app-mesh fixed inset-x-0 top-0 -z-10 h-[140vh]"
      />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
