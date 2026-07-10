import { ListTree } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Multi Level — Level 2 target (W5): a leaf page sitting three levels deep in
 * the sidebar (Multi Level ▸ Level 2 ▸ this), proving deep nested menus route.
 */
export function MultiLevelTwoPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.multiLevel.two.title")}
      description={t("showcase.multiLevel.two.desc")}
      icon={ListTree}
      breadcrumb={{ group: t("nav.components.multiLevel") }}
    >
      <ComponentDemo
        title={t("showcase.multiLevel.path")}
        notes={t("showcase.multiLevel.note")}
      >
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li className="rounded-lg border border-[var(--glass-border)] bg-background/40 px-3 py-1.5">
            {t("nav.components.multiLevel")}
          </li>
          <span className="text-muted-foreground">/</span>
          <li className="rounded-lg border border-[var(--glass-border)] bg-background/40 px-3 py-1.5">
            {t("showcase.multiLevel.level", { level: "1" })}
          </li>
          <span className="text-muted-foreground">/</span>
          <li className="rounded-lg border border-[var(--glass-border)] bg-background/40 px-3 py-1.5">
            {t("showcase.multiLevel.level", { level: "2" })}
          </li>
          <span className="text-muted-foreground">/</span>
          <li className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-primary">
            {t("showcase.multiLevel.two.title")}
          </li>
        </ol>
      </ComponentDemo>
    </ShowcasePage>
  );
}
