import type { ReactNode } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Grid showcase (W5): Tailwind grid/layout utilities demonstrated with bordered
 * token boxes — column counts, gap scale, responsive spans, and an auto-fitting
 * responsive layout. Static demos — no data flow.
 */

/** A labelled cell used to visualise grid placement. */
function Cell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-center rounded-lg bg-muted px-2 text-xs font-medium text-muted-foreground ring-1 ring-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GridPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.grid.title")}
      description={t("showcase.base.grid.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.grid.columns")}
        previewClassName="block"
        code={`<div className="grid grid-cols-3 gap-4">
  <div>1</div>
  <div>2</div>
  <div>3</div>
</div>`}
      >
        <div className="flex w-full flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <Cell key={n}>grid-cols-2</Cell>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Cell key={n}>grid-cols-3</Cell>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <Cell key={n}>grid-cols-4</Cell>
            ))}
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.grid.gaps")}
        previewClassName="block"
        code={`<div className="grid grid-cols-4 gap-2">…</div>
<div className="grid grid-cols-4 gap-6">…</div>`}
      >
        <div className="flex w-full flex-col gap-4">
          {(["gap-2", "gap-4", "gap-6"] as const).map((gap) => (
            <div key={gap} className={cn("grid grid-cols-4", gap)}>
              {[1, 2, 3, 4].map((n) => (
                <Cell key={n}>{gap}</Cell>
              ))}
            </div>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.grid.responsive")}
        notes={t("showcase.base.grid.note")}
        previewClassName="block"
        code={`<div className="grid grid-cols-6 gap-4">
  <div className="col-span-4">col-span-4</div>
  <div className="col-span-2">col-span-2</div>
  <div className="col-span-3">col-span-3</div>
  <div className="col-span-3">col-span-3</div>
  <div className="col-span-6">col-span-6</div>
</div>`}
      >
        <div className="grid w-full grid-cols-6 gap-4">
          <Cell className="col-span-4">col-span-4</Cell>
          <Cell className="col-span-2">col-span-2</Cell>
          <Cell className="col-span-3">col-span-3</Cell>
          <Cell className="col-span-3">col-span-3</Cell>
          <Cell className="col-span-6">col-span-6</Cell>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.grid.auto")}
        previewClassName="block"
        code={`<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {items.map((i) => <div key={i}>{i}</div>)}
</div>`}
      >
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Cell key={n}>{n}</Cell>
          ))}
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
