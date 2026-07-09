import { Outlet } from "react-router";

import { useLocale } from "@/lib/use-locale";

/*
 * Anonymous/public routes (logout, status, error, maintenance, legal): the mesh
 * backdrop with no auth guard and no shell. Each page owns its own framing —
 * status pages center a card, legal pages fill a reading column.
 */

export function PublicLayout() {
  useLocale();
  return (
    <div className="relative min-h-svh">
      <div aria-hidden className="app-mesh fixed inset-0 -z-10" />
      <div aria-hidden className="app-mesh-noise fixed inset-0 -z-10" />
      <Outlet />
    </div>
  );
}
