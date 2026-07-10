import { ArrowRight, Plus, Trash2 } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Buttons showcase (W5): every Button variant, size, icon layout and interactive
 * state, each as a ComponentDemo with a live preview + literal code sample.
 */
export function ButtonsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.buttons.title")}
      description={t("showcase.base.buttons.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        code={`<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="success">Success</Button>
<Button variant="warning">Warning</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="destructive-filled">Delete</Button>
<Button variant="link">Link</Button>`}
      >
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="success">Success</Button>
        <Button variant="warning">Warning</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="destructive-filled">Delete</Button>
        <Button variant="link">Link</Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        code={`<Button size="xs">Extra small</Button>
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon" aria-label="Add"><Plus /></Button>`}
      >
        <Button size="xs">Extra small</Button>
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
        <Button size="icon" variant="outline" aria-label="Add">
          <Plus />
        </Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.withIcon")}
        code={`<Button><Plus />New item</Button>
<Button variant="outline">Continue<ArrowRight /></Button>
<Button variant="destructive-filled"><Trash2 />Delete</Button>`}
      >
        <Button>
          <Plus />
          New item
        </Button>
        <Button variant="outline">
          Continue
          <ArrowRight className="rtl:-scale-x-100" />
        </Button>
        <Button variant="destructive-filled">
          <Trash2 />
          Delete
        </Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.states")}
        notes={t("showcase.base.buttons.states_note")}
        code={`<Button disabled>Disabled</Button>
<Button disabled><Spinner />Saving…</Button>`}
      >
        <Button disabled>Disabled</Button>
        <Button disabled>
          <Spinner />
          Saving…
        </Button>
      </ComponentDemo>
    </ShowcasePage>
  );
}
