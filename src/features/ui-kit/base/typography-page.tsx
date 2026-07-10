import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Typography showcase (W5): the heading scale, body copy, inline elements and
 * block elements, all built on the font + color tokens. Static docs demo.
 */
export function TypographyPage() {
  useLocale();

  return (
    <ShowcasePage
      title={t("showcase.base.typography.title")}
      description={t("showcase.base.typography.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.typography.headings")}
        notes={t("showcase.base.typography.note")}
        previewClassName="block"
        code={`<h1 className="font-heading text-4xl font-semibold">Heading 1</h1>
<h2 className="font-heading text-3xl font-semibold">Heading 2</h2>
<h3 className="font-heading text-2xl font-medium">Heading 3</h3>
<h4 className="font-heading text-xl font-medium">Heading 4</h4>
<h5 className="font-heading text-lg font-medium">Heading 5</h5>
<h6 className="font-heading text-base font-medium">Heading 6</h6>`}
      >
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {t("showcase.base.typography.headings")} 1
          </h1>
          <h2 className="font-heading text-3xl font-semibold tracking-tight">
            {t("showcase.base.typography.headings")} 2
          </h2>
          <h3 className="font-heading text-2xl font-medium">
            {t("showcase.base.typography.headings")} 3
          </h3>
          <h4 className="font-heading text-xl font-medium">
            {t("showcase.base.typography.headings")} 4
          </h4>
          <h5 className="font-heading text-lg font-medium">
            {t("showcase.base.typography.headings")} 5
          </h5>
          <h6 className="font-heading text-base font-medium">
            {t("showcase.base.typography.headings")} 6
          </h6>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.typography.body")}
        previewClassName="block"
        code={`<p className="text-lg text-muted-foreground">Lead paragraph</p>
<p className="text-sm">Body copy</p>
<small className="text-xs text-muted-foreground">Small print</small>`}
      >
        <div className="max-w-prose space-y-3">
          <p className="text-lg text-muted-foreground">
            {t("showcase.base.typography.lead")}
          </p>
          <p className="text-sm leading-relaxed">
            {t("showcase.base.typography.para")}
          </p>
          <small className="block text-xs text-muted-foreground">
            {t("showcase.base.typography.small")}
          </small>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.typography.inline")}
        previewClassName="block"
        code={`<strong>strong</strong> <em>emphasis</em>
<code className="rounded bg-muted px-1 py-0.5 text-xs">inline code</code>
<a className="text-primary underline-offset-4 hover:underline">link</a>`}
      >
        <p className="max-w-prose text-sm leading-relaxed">
          <strong className="font-semibold">strong</strong>{" "}
          <em className="italic">emphasis</em>{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            inline code
          </code>{" "}
          <a
            href="#typography"
            className="text-primary underline-offset-4 hover:underline"
          >
            link
          </a>{" "}
          <span className="text-muted-foreground">muted text</span>
        </p>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.typography.blocks")}
        previewClassName="block"
        code={`<blockquote className="border-s-2 border-border ps-4 italic text-muted-foreground">
  Quote text
</blockquote>
<ul className="list-disc ps-5">
  <li>First list item</li>
</ul>`}
      >
        <div className="max-w-prose space-y-4">
          <blockquote className="border-s-2 border-border ps-4 text-sm italic text-muted-foreground">
            {t("showcase.base.typography.quote")}
            <footer className="mt-1 text-xs not-italic">
              — {t("showcase.base.typography.quoteCite")}
            </footer>
          </blockquote>
          <ul className="list-disc space-y-1 ps-5 text-sm">
            <li>{t("showcase.base.typography.item1")}</li>
            <li>{t("showcase.base.typography.item2")}</li>
            <li>{t("showcase.base.typography.item3")}</li>
          </ul>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
