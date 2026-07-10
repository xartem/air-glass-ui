import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { MultiSelect } from "@/components/multi-select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const SKILL_OPTIONS = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "tailwind", label: "Tailwind CSS" },
  { value: "vite", label: "Vite" },
  { value: "node", label: "Node.js" },
  { value: "graphql", label: "GraphQL" },
];

const FRAMEWORKS = [
  "React",
  "Vue",
  "Svelte",
  "Angular",
  "Solid",
  "Qwik",
  "Preact",
  "Lit",
];

/*
 * Advanced inputs showcase (W5): the tag-style MultiSelect and the searchable
 * single-value Combobox — both controlled through useState. These wrap the
 * shared multi-select / combobox primitives; screens never rebuild them.
 */
export function AdvancedPage() {
  useLocale();
  const [skills, setSkills] = useState<string[]>(["react", "typescript"]);
  const [framework, setFramework] = useState<string | null>("React");

  return (
    <ShowcasePage
      title={t("showcase.forms.advanced.title")}
      description={t("showcase.forms.advanced.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.tags")}
        previewClassName="block"
        notes={t("showcase.forms.advanced.tagsNote")}
        code={`const [skills, setSkills] = useState<string[]>(["react", "typescript"]);

<MultiSelect
  options={SKILL_OPTIONS}
  value={skills}
  onChange={setSkills}
/>`}
      >
        <div className="w-full max-w-sm">
          <FormField name="adv-skills" label={t("uikit.field.category")}>
            <MultiSelect
              id="adv-skills"
              options={SKILL_OPTIONS}
              value={skills}
              onChange={setSkills}
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.searchable")}
        previewClassName="block"
        notes={t("showcase.forms.advanced.comboNote")}
        code={`const [framework, setFramework] = useState<string | null>("React");

<Combobox items={FRAMEWORKS} value={framework} onValueChange={setFramework}>
  <ComboboxInput placeholder="Search…" />
  <ComboboxContent>
    <ComboboxEmpty>No results.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
      >
        <div className="w-full max-w-xs">
          <FormField name="adv-framework" label={t("uikit.field.category")}>
            <Combobox
              items={FRAMEWORKS}
              value={framework}
              onValueChange={setFramework}
            >
              <ComboboxInput
                id="adv-framework"
                placeholder={t("common.search")}
              />
              <ComboboxContent>
                <ComboboxEmpty>{t("reference.empty")}</ComboboxEmpty>
                <ComboboxList>
                  {(item: string) => (
                    <ComboboxItem key={item} value={item}>
                      {item}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
