import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
 * Panel (E6, decision 2026-07-03): screen content NEVER sits bare on the mesh
 * background — every meaningful block (form, table, filters+list) lives inside
 * a glass-card section. Optional header: icon + title + description, with an
 * actions slot on the right.
 */

export function Panel({
  icon: Icon,
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      data-slot="panel"
      className={cn("glass-card rounded-2xl", className)}
    >
      {title || actions ? (
        <header className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p className="text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </section>
  );
}
