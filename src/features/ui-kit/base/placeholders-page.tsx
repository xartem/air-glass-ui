import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Placeholders showcase (W5): Skeleton loaders composed into text, card and
 * list layouts that mirror real content. Static docs demo — no data flow.
 */
export function PlaceholdersPage() {
  useLocale();

  return (
    <ShowcasePage
      title={t("showcase.base.placeholders.title")}
      description={t("showcase.base.placeholders.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.placeholders.text")}
        notes={t("showcase.base.placeholders.note")}
        previewClassName="block"
        code={`<div className="space-y-2">
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-3 w-full" />
  <Skeleton className="h-3 w-full" />
  <Skeleton className="h-3 w-4/5" />
</div>`}
      >
        <div className="w-full max-w-sm space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.placeholders.card")}
        previewClassName="block"
        code={`<div className="rounded-xl border border-border p-4 space-y-3">
  <Skeleton className="h-32 w-full rounded-lg" />
  <Skeleton className="h-4 w-2/3" />
  <Skeleton className="h-3 w-full" />
  <div className="flex gap-2 pt-1">
    <Skeleton className="h-8 w-20 rounded-lg" />
    <Skeleton className="h-8 w-20 rounded-lg" />
  </div>
</div>`}
      >
        <div className="w-full max-w-xs space-y-3 rounded-xl border border-border p-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.placeholders.list")}
        previewClassName="block"
        code={`<div className="space-y-4">
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3.5 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
</div>`}
      >
        <div className="w-full max-w-sm space-y-4">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-6 w-14 rounded-md" />
            </div>
          ))}
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
