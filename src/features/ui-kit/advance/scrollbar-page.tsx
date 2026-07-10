import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Scrollbar showcase (W5): styled scroll containers built on the shared
 * ScrollArea primitive — vertical overflow, horizontal overflow, and a
 * both-axes box. Token borders + custom thin thumbs. Static demos.
 */

const ROWS = Array.from({ length: 20 }, (_, i) => i + 1);
const TAGS = Array.from({ length: 16 }, (_, i) => `Tag ${i + 1}`);

export function ScrollbarPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.advance.scrollbar.title")}
      description={t("showcase.advance.scrollbar.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.advance.scrollbar.vertical")}
        previewClassName="flex-col items-stretch"
        code={`<ScrollArea className="h-56 rounded-lg border">
  <div className="p-3">
    {rows.map((row) => (
      <div key={row}>Row {row}</div>
    ))}
  </div>
</ScrollArea>`}
      >
        <ScrollArea className="h-56 w-full max-w-sm rounded-lg border border-[var(--glass-border)]">
          <div className="flex flex-col gap-1 p-3">
            {ROWS.map((row) => (
              <div
                key={row}
                className="rounded-md bg-background/40 px-3 py-2 text-sm"
              >
                {t("showcase.advance.scrollbar.rowLabel", { n: String(row) })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.scrollbar.horizontal")}
        previewClassName="flex-col items-stretch"
        code={`<ScrollArea className="w-full max-w-md rounded-lg border">
  <div className="flex gap-2 p-3">
    {tags.map((tag) => (
      <span key={tag}>{tag}</span>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}
      >
        <ScrollArea className="w-full max-w-md rounded-lg border border-[var(--glass-border)]">
          <div className="flex gap-2 p-3">
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="shrink-0 rounded-full bg-background/40 px-3 py-1.5 text-sm whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.scrollbar.both")}
        notes={t("showcase.advance.scrollbar.note")}
        previewClassName="flex-col items-stretch"
        code={`<ScrollArea className="h-56 rounded-lg border">
  <div className="w-[720px] p-3">…wide + tall content…</div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}
      >
        <ScrollArea className="h-56 w-full max-w-md rounded-lg border border-[var(--glass-border)]">
          <div className="w-[720px] p-3">
            <div className="flex flex-col gap-1">
              {ROWS.map((row) => (
                <div
                  key={row}
                  className={cn(
                    "rounded-md bg-background/40 px-3 py-2 text-sm whitespace-nowrap",
                  )}
                >
                  {t("showcase.advance.scrollbar.wideRow", { n: String(row) })}
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </ComponentDemo>
    </ShowcasePage>
  );
}
