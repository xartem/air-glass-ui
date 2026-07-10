import { useEffect, useState } from "react";

import { devDebug } from "@/lib/debug";

/*
 * useScrollSpy (W5 gap hook): given a list of section element ids, returns the
 * id of the section currently in view via IntersectionObserver — for anchor
 * navigation on long docs/showcase pages. Interactive, so it logs on the
 * active-section change (devDebug, dev-only).
 */
export function useScrollSpy(
  ids: string[],
  options?: { rootMargin?: string },
): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join(",");
  const rootMargin = options?.rootMargin ?? "0px 0px -66% 0px";

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin, threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
    // key is the stable serialization of ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, rootMargin]);

  useEffect(() => {
    if (active) devDebug("[scrollspy] active", active);
  }, [active]);

  return active;
}
