import { Check, Circle, Star, X } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Badges showcase (W5): every Badge variant, the three sizes, icon layouts, and
 * a few applied examples. Static demos — no data flow.
 */
export function BadgesPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.badges.title")}
      description={t("showcase.base.badges.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="ghost">Ghost</Badge>
<Badge variant="link">Link</Badge>`}
      >
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
        <Badge variant="link">Link</Badge>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        code={`<Badge size="sm">Small</Badge>
<Badge size="default">Default</Badge>
<Badge size="lg">Large</Badge>`}
      >
        <Badge size="sm">Small</Badge>
        <Badge size="default">Default</Badge>
        <Badge size="lg">Large</Badge>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.withIcon")}
        code={`<Badge variant="success"><Check />Active</Badge>
<Badge variant="warning"><Circle />Pending</Badge>
<Badge variant="destructive"><X />Failed</Badge>
<Badge variant="secondary">4.9<Star /></Badge>`}
      >
        <Badge variant="success">
          <Check />
          Active
        </Badge>
        <Badge variant="warning">
          <Circle />
          Pending
        </Badge>
        <Badge variant="destructive">
          <X />
          Failed
        </Badge>
        <Badge variant="secondary">
          4.9
          <Star />
        </Badge>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.examples")}
        notes={t("showcase.base.badges.link_note")}
        code={`<Badge variant="info">Beta</Badge>
<Badge variant="outline">v2.4.0</Badge>
<Badge variant="destructive">3</Badge>
<Badge asChild variant="link"><a href="/ui-kit">Docs</a></Badge>`}
      >
        <Badge variant="info">Beta</Badge>
        <Badge variant="outline">v2.4.0</Badge>
        <Badge variant="destructive">3</Badge>
        <Badge asChild variant="link">
          <a href="/ui-kit">Docs</a>
        </Badge>
      </ComponentDemo>
    </ShowcasePage>
  );
}
