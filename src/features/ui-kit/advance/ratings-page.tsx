import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Rating } from "@/components/ui/rating";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Ratings showcase (W5): the Rating primitive — read-only display, interactive
 * (click/keyboard/hover) input, and the three sizes. Local useState holds the
 * interactive value. Static demos.
 */

function InteractiveRating() {
  const [value, setValue] = useState(3);
  return (
    <div className="flex items-center gap-3">
      <Rating
        value={value}
        onValueChange={setValue}
        label={t("showcase.advance.ratings.label")}
      />
      <span className="text-sm text-muted-foreground">
        {t("showcase.advance.ratings.valueOf", { value: String(value) })}
      </span>
    </div>
  );
}

export function RatingsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.advance.ratings.title")}
      description={t("showcase.advance.ratings.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.advance.ratings.readonly")}
        code={`<Rating value={4} readOnly />
<Rating value={3} readOnly />
<Rating value={5} readOnly />`}
      >
        <Rating value={4} readOnly />
        <Rating value={3} readOnly />
        <Rating value={5} readOnly />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.ratings.interactive")}
        notes={t("showcase.advance.ratings.note")}
        code={`const [value, setValue] = useState(3);

<Rating value={value} onValueChange={setValue} />`}
      >
        <InteractiveRating />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        previewClassName="flex-col items-start"
        code={`<Rating value={4} readOnly size="sm" />
<Rating value={4} readOnly size="default" />
<Rating value={4} readOnly size="lg" />`}
      >
        <Rating value={4} readOnly size="sm" />
        <Rating value={4} readOnly size="default" />
        <Rating value={4} readOnly size="lg" />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.disabled")}
        code={`<Rating value={2} disabled />`}
      >
        <Rating value={2} disabled />
      </ComponentDemo>
    </ShowcasePage>
  );
}
