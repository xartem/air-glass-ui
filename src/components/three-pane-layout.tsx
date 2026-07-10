import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Three-pane workspace shell (rail / list / detail) used by mail-style screens
 * — the inbox chat and the email mailbox. On desktop the three panes sit side
 * by side; on mobile it collapses to a single-pane drill-down driven by
 * `showDetail` (list → detail → back). The list and detail slots are wrapped in
 * glass cards; the rail is a bare aside so callers control its chrome.
 */

export interface ThreePaneLayoutProps {
  /** Left navigation rail; hidden on mobile (move its controls into the list). */
  rail?: ReactNode;
  list: ReactNode;
  detail: ReactNode;
  /** When true the detail pane replaces the list on mobile. */
  showDetail: boolean;
  /** Grid template for the desktop breakpoint; override to retune widths. */
  columns?: string;
  className?: string;
}

export function ThreePaneLayout({
  rail,
  list,
  detail,
  showDetail,
  columns = "lg:grid-cols-[13rem_20rem_1fr]",
  className,
}: ThreePaneLayoutProps) {
  return (
    <div className={cn("grid min-h-0 flex-1 gap-4", columns, className)}>
      {rail ? (
        <aside className="hidden min-h-0 flex-col gap-1 lg:flex">{rail}</aside>
      ) : null}

      <section
        className={cn(
          "glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl",
          showDetail && "max-lg:hidden",
        )}
      >
        {list}
      </section>

      <section
        className={cn(
          "glass-card flex min-h-0 flex-col overflow-hidden rounded-2xl",
          !showDetail && "max-lg:hidden",
        )}
      >
        {detail}
      </section>
    </div>
  );
}
