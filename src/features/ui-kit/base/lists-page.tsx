import { Check } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Lists showcase (W5): unordered/ordered, description and divided list
 * patterns built on tokens. Static docs demo — no data flow.
 */
export function ListsPage() {
  useLocale();

  const items = [
    t("showcase.base.lists.item1"),
    t("showcase.base.lists.item2"),
    t("showcase.base.lists.item3"),
  ];

  const terms = [
    { term: t("showcase.base.lists.term1"), desc: t("showcase.base.lists.desc1") },
    { term: t("showcase.base.lists.term2"), desc: t("showcase.base.lists.desc2") },
    { term: t("showcase.base.lists.term3"), desc: t("showcase.base.lists.desc3") },
  ];

  const rows = [
    t("showcase.base.lists.row1"),
    t("showcase.base.lists.row2"),
    t("showcase.base.lists.row3"),
  ];

  return (
    <ShowcasePage
      title={t("showcase.base.lists.title")}
      description={t("showcase.base.lists.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.base.lists.basic")}
        previewClassName="block"
        code={`<ul className="list-disc ps-5">
  <li>Review pull requests</li>
</ul>
<ol className="list-decimal ps-5">
  <li>Review pull requests</li>
</ol>`}
      >
        <div className="grid w-full max-w-md gap-6 sm:grid-cols-2">
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <ol className="list-decimal space-y-1 ps-5 text-sm">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.lists.description")}
        previewClassName="block"
        code={`<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
  <dt className="text-muted-foreground">Plan</dt>
  <dd className="font-medium">Business Pro</dd>
</dl>`}
      >
        <dl className="grid w-full max-w-sm grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {terms.map(({ term, desc }) => (
            <div key={term} className="contents">
              <dt className="text-muted-foreground">{term}</dt>
              <dd className="text-end font-medium">{desc}</dd>
            </div>
          ))}
        </dl>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.lists.divided")}
        notes={t("showcase.base.lists.note")}
        previewClassName="block"
        code={`<ul className="divide-y divide-border rounded-lg border border-border">
  <li className="flex items-center gap-2 px-3 py-2.5">
    <Check className="size-4 text-primary" />
    Dashboard
  </li>
</ul>`}
      >
        <ul className="w-full max-w-sm divide-y divide-border rounded-lg border border-border">
          {rows.map((row) => (
            <li key={row} className="flex items-center gap-2 px-3 py-2.5 text-sm">
              <Check className="size-4 text-primary" />
              {row}
            </li>
          ))}
        </ul>
      </ComponentDemo>
    </ShowcasePage>
  );
}
