import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Links showcase (W5): anchor and link styles — variants, the Button link
 * variant and inline links inside body text. Static docs demo.
 */
export function LinksPage() {
  useLocale();

  const base = "underline-offset-4 hover:underline focus-visible:underline";

  return (
    <ShowcasePage
      title={t("showcase.base.links.title")}
      description={t("showcase.base.links.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        notes={t("showcase.base.links.note")}
        code={`<a className="text-primary underline-offset-4 hover:underline">Default link</a>
<a className="text-muted-foreground underline-offset-4 hover:underline">Muted link</a>
<a className="text-primary underline underline-offset-4">Underlined link</a>`}
      >
        <a href="#links" className={cn("text-sm text-primary", base)}>
          {t("showcase.base.links.default")}
        </a>
        <a href="#links" className={cn("text-sm text-muted-foreground", base)}>
          {t("showcase.base.links.muted")}
        </a>
        <a
          href="#links"
          className="text-sm text-primary underline underline-offset-4"
        >
          {t("showcase.base.links.underline")}
        </a>
        <a
          href="#links"
          className={cn(
            "inline-flex items-center gap-0.5 text-sm text-primary",
            base,
          )}
        >
          {t("showcase.base.links.external")}
          <ArrowUpRight className="size-3.5" />
        </a>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.links.button")}
        code={`<Button variant="link">Default link</Button>
<Button variant="link" asChild>
  <Link to="/ui-kit">Router link</Link>
</Button>`}
      >
        <Button variant="link">{t("showcase.base.links.default")}</Button>
        <Button variant="link" asChild>
          <Link to="/ui-kit">{t("showcase.base.links.router")}</Link>
        </Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.links.inline")}
        previewClassName="block"
        code={`<p className="text-sm">
  Read the{" "}
  <a className="text-primary underline underline-offset-4">getting started guide</a>{" "}
  before diving into the components.
</p>`}
      >
        <p className="max-w-prose text-sm leading-relaxed">
          {t("showcase.base.links.inlinePre")}{" "}
          <a
            href="#links"
            className="text-primary underline underline-offset-4"
          >
            {t("showcase.base.links.inlineLink")}
          </a>{" "}
          {t("showcase.base.links.inlinePost")}
        </p>
      </ComponentDemo>
    </ShowcasePage>
  );
}
