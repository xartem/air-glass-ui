import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  NestableList,
  type NestableItem,
} from "@/components/nestable-list";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Nestable List showcase (W5): the NestableList gap primitive — drag a row to
 * reorder it, or drag horizontally to change its nesting depth. Local useState
 * holds the tree; the primitive logs its own drops internally.
 */

const INITIAL_ITEMS: NestableItem[] = [
  {
    id: "getting-started",
    label: "Getting started",
    children: [
      { id: "installation", label: "Installation" },
      { id: "project-structure", label: "Project structure" },
    ],
  },
  {
    id: "components",
    label: "Components",
    children: [
      { id: "buttons", label: "Buttons" },
      {
        id: "forms",
        label: "Forms",
        children: [
          { id: "inputs", label: "Inputs" },
          { id: "selects", label: "Selects" },
        ],
      },
    ],
  },
  { id: "theming", label: "Theming" },
  { id: "changelog", label: "Changelog" },
];

export function NestableListPage() {
  useLocale();
  const [items, setItems] = useState<NestableItem[]>(INITIAL_ITEMS);

  return (
    <ShowcasePage
      title={t("showcase.advance.nestableList.title")}
      description={t("showcase.advance.nestableList.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.s.default")}
        notes={t("showcase.advance.nestableList.note")}
        previewClassName="flex-col items-stretch"
        code={`const [items, setItems] = useState(initialItems);

<NestableList items={items} onChange={setItems} />`}
      >
        <NestableList
          items={items}
          onChange={setItems}
          className="w-full max-w-md"
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
