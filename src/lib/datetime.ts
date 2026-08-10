import { useMemo } from "react";

import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/use-locale";

/*
 * Absolute time in the admin renders in the SITE timezone by decision, not
 * the operator's browser — so every operator sees the same wall-clock time. The
 * The DB stores UTC; these formatters convert to `me.timezone`.
 * Relative times ("5 minutes ago", date-fns) are timezone-independent and are
 * NOT routed through here.
 */
export function useSiteDateTime() {
  const locale = useLocale();
  const { me } = useAuth();
  const timeZone = me.timezone || "UTC";

  return useMemo(() => {
    const short = new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
      timeZone,
    });
    const long = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone,
    });
    return {
      timezone: timeZone,
      /** e.g. "31.12.26, 23:45" — in the site timezone. */
      format: (value: string | Date) => short.format(new Date(value)),
      /** e.g. "Dec 31, 2026, 23:45:12" — in the site timezone. */
      formatLong: (value: string | Date) => long.format(new Date(value)),
    };
  }, [locale, timeZone]);
}
