import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  api,
  type AppearanceSettings,
  type AppearanceStyle,
  type AppearanceTokens,
} from "@/api";

/*
 * Appearance apply layer (E1 §2.2.1). Reads the site-wide config and reflects it onto
 * the document root: the skin-* class, data-bg-* preset attributes, inline glass/radius/
 * accent token overrides and custom background image vars. A per-browser style override
 * (topbar quick toggle) can preview a style without touching the saved site config.
 */

export const APPEARANCE_STYLES: AppearanceStyle[] = ["glass", "liquid", "flat"];

/** Sensible token starting point per style — used on style switch and by the quick toggle. */
export const STYLE_BASELINES: Record<
  AppearanceStyle,
  Pick<AppearanceTokens, "blur" | "radius" | "saturate">
> = {
  glass: { blur: 28, radius: 12, saturate: 160 },
  liquid: { blur: 40, radius: 18, saturate: 190 },
  flat: { blur: 0, radius: 10, saturate: 100 },
};

const OVERRIDE_KEY = "admin.appearance.styleOverride";

function readOverride(): AppearanceStyle | null {
  const v = localStorage.getItem(OVERRIDE_KEY);
  return v === "glass" || v === "liquid" || v === "flat" ? v : null;
}

/** Reflect a full appearance config onto the document root. Idempotent. */
export function applyAppearance(a: AppearanceSettings): void {
  const root = document.documentElement;
  for (const style of APPEARANCE_STYLES)
    root.classList.toggle(`skin-${style}`, a.style === style);
  root.dir = a.dir ?? "ltr";
  root.dataset.bgLight = a.bgLight;
  root.dataset.bgDark = a.bgDark;
  // Layout dimensions (density / content width) — CSS in index.css keys off these attrs.
  root.dataset.density = a.density;
  root.dataset.contentWidth = a.contentWidth;

  const s = root.style;
  s.setProperty("--glass-blur-sidebar", `${a.tokens.blur}px`);
  s.setProperty("--glass-blur-header", `${a.tokens.blur}px`);
  s.setProperty("--glass-blur-card", `${a.tokens.blur}px`);
  s.setProperty("--glass-blur-small", `${Math.round(a.tokens.blur * 0.6)}px`);
  s.setProperty("--radius", `${a.tokens.radius}px`);
  s.setProperty("--glass-saturate", `${a.tokens.saturate}%`);
  // Only --primary needs setting — the whole accent family (ring/nav/gradients/select
  // highlight/sidebar) derives from it via color-mix in :root/.dark (index.css).
  s.setProperty("--primary", a.tokens.accent);
  s.setProperty(
    "--bg-custom-light",
    a.customLight ? `url("${a.customLight}")` : "none",
  );
  s.setProperty(
    "--bg-custom-dark",
    a.customDark ? `url("${a.customDark}")` : "none",
  );
}

export function useAppearance() {
  const query = useQuery({
    queryKey: ["appearance"],
    queryFn: api.appearance.get,
    staleTime: 60_000,
  });
  const [override, setOverride] = useState<AppearanceStyle | null>(
    readOverride,
  );
  const site = query.data;

  useEffect(() => {
    if (!site) return;
    const style = override ?? site.style;
    // A live override previews just the style: adopt its baseline blur/radius/saturate,
    // keep the site accent; saved config is untouched.
    const tokens = override
      ? { ...STYLE_BASELINES[override], accent: site.tokens.accent }
      : site.tokens;
    applyAppearance({ ...site, style, tokens });
  }, [site, override]);

  // Topbar quick toggle: site (no override) → glass → liquid → flat → site.
  function cycleStyle() {
    const order: (AppearanceStyle | null)[] = [null, "glass", "liquid", "flat"];
    const next = order[(order.indexOf(override) + 1) % order.length];
    if (next) localStorage.setItem(OVERRIDE_KEY, next);
    else localStorage.removeItem(OVERRIDE_KEY);
    setOverride(next);
  }

  // Drop the transient topbar preview so the saved config becomes authoritative —
  // the customizer calls this when the user commits to a style there (E1 §2.2.1).
  function clearOverride() {
    localStorage.removeItem(OVERRIDE_KEY);
    setOverride(null);
  }

  return {
    query,
    override,
    effectiveStyle: override ?? site?.style ?? "glass",
    // Effective reading direction, defaulting to 'ltr' until the query resolves — a
    // style override only previews the skin, never the direction. Consumed by the
    // global Radix DirectionProvider so overlays mirror in RTL, not just CSS logicals.
    dir: site?.dir ?? "ltr",
    cycleStyle,
    clearOverride,
  };
}
