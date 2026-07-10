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

const COUNTRIES = [
  "Germany",
  "Spain",
  "France",
  "Italy",
  "Poland",
  "Portugal",
  "Ukraine",
  "United Kingdom",
  "United States",
];

const TECH_OPTIONS = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
  { value: "solid", label: "Solid" },
  { value: "astro", label: "Astro" },
];

/*
 * Select2 showcase (W5): the modern replacement for the legacy Select2 plugin —
 * a searchable single-value Combobox and a searchable multi-value MultiSelect,
 * both controlled through useState. Design-token styling, keyboard accessible.
 */
export function Select2Page() {
  useLocale();
  const [country, setCountry] = useState<string | null>("France");
  const [stack, setStack] = useState<string[]>(["react", "svelte"]);

  return (
    <ShowcasePage
      title={t("showcase.forms.select2.title")}
      description={t("showcase.forms.select2.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.searchable")}
        previewClassName="block"
        notes={t("showcase.forms.select2.singleNote")}
        code={`const [country, setCountry] = useState<string | null>("France");

<Combobox items={COUNTRIES} value={country} onValueChange={setCountry}>
  <ComboboxInput placeholder="Search a country…" />
  <ComboboxContent>
    <ComboboxEmpty>No results.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem key={item} value={item}>{item}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}
      >
        <div className="w-full max-w-xs">
          <FormField
            name="s2-country"
            label={t("showcase.forms.select2.country")}
          >
            <Combobox
              items={COUNTRIES}
              value={country}
              onValueChange={setCountry}
            >
              <ComboboxInput id="s2-country" placeholder={t("common.search")} />
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

      <ComponentDemo
        title={t("showcase.forms.s.multi")}
        previewClassName="block"
        notes={t("showcase.forms.select2.multiNote")}
        code={`const [stack, setStack] = useState<string[]>(["react", "svelte"]);

<MultiSelect options={TECH_OPTIONS} value={stack} onChange={setStack} />`}
      >
        <div className="w-full max-w-sm">
          <FormField name="s2-stack" label={t("showcase.forms.select2.stack")}>
            <MultiSelect
              id="s2-stack"
              options={TECH_OPTIONS}
              value={stack}
              onChange={setStack}
            />
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
