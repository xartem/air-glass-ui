import { useState } from "react";
import { Search } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Highlight } from "@/lib/highlight";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Highlight showcase (W5): the Highlight gap util wraps every case-insensitive
 * match of a live query in a token-styled <mark>. A search Input drives the
 * query; matching runs on React text nodes only (injection-safe). Static demo.
 */

const PARAGRAPH =
  "Air Glass UI is a React 19 admin template built on Vite and Tailwind CSS. It ships a glassmorphism design system with light and dark skins, accessible components, and full internationalization. Search this paragraph to see matching terms highlighted in place.";

export function HighlightPage() {
  useLocale();
  const [query, setQuery] = useState("Tailwind");

  return (
    <ShowcasePage
      title={t("showcase.advance.highlight.title")}
      description={t("showcase.advance.highlight.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.advance.highlight.note")}
        previewClassName="flex-col items-stretch gap-4"
        code={`const [query, setQuery] = useState("Tailwind");

<Input value={query} onChange={(e) => setQuery(e.target.value)} />
<p><Highlight text={paragraph} query={query} /></p>`}
      >
        <div className="w-full max-w-sm">
          <Label htmlFor="highlight-search" className="mb-1.5 block">
            {t("showcase.advance.highlight.searchLabel")}
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="highlight-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("showcase.advance.highlight.placeholder")}
              className="ps-9"
            />
          </div>
        </div>
        <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
          <Highlight text={PARAGRAPH} query={query} />
        </p>
      </ComponentDemo>
    </ShowcasePage>
  );
}
