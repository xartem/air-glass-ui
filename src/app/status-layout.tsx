import { Outlet } from "react-router";

import { useLocale } from "@/lib/use-locale";

/*
 * Centered public status pages (logout, success): mesh backdrop with a single
 * centered card column, no auth guard. The cover variants of these pages reuse
 * the split CoverLayout instead.
 */

export function StatusLayout() {
  useLocale();
  return (
    <div className="relative flex min-h-svh items-center justify-center p-4">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <div className="w-full max-w-sm">
        <Outlet />
      </div>
    </div>
  );
}
