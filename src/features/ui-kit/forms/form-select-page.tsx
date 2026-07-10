import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Select showcase (W5): the Radix-backed Select — sizes, grouped options and
 * disabled items/triggers. Static demos; option content is literal demo data.
 */
export function FormSelectPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.forms.formSelect.title")}
      description={t("showcase.forms.formSelect.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.basic")}
        previewClassName="block"
        code={`<Select defaultValue="apple">
  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="cherry">Cherry</SelectItem>
  </SelectContent>
</Select>`}
      >
        <div className="w-full max-w-xs">
          <FormField name="select-basic" label={t("uikit.field.category")}>
            <Select defaultValue="apple">
              <SelectTrigger id="select-basic" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        previewClassName="block"
        code={`<SelectTrigger size="sm">…</SelectTrigger>
<SelectTrigger size="default">…</SelectTrigger>
<SelectTrigger size="lg">…</SelectTrigger>`}
      >
        <div className="grid w-full gap-3 sm:grid-cols-3">
          {(["sm", "default", "lg"] as const).map((size) => (
            <Select key={size} defaultValue="apple">
              <SelectTrigger size={size} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
              </SelectContent>
            </Select>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.groups")}
        previewClassName="block"
        code={`<SelectContent>
  <SelectGroup>
    <SelectLabel>Fruits</SelectLabel>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectGroup>
  <SelectSeparator />
  <SelectGroup>
    <SelectLabel>Vegetables</SelectLabel>
    <SelectItem value="carrot">Carrot</SelectItem>
  </SelectGroup>
</SelectContent>`}
      >
        <div className="w-full max-w-xs">
          <FormField name="select-groups" label={t("uikit.field.category")}>
            <Select>
              <SelectTrigger id="select-groups" className="w-full">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="cherry">Cherry</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Vegetables</SelectLabel>
                  <SelectItem value="carrot">Carrot</SelectItem>
                  <SelectItem value="potato">Potato</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.disabled")}
        previewClassName="block"
        notes={t("showcase.forms.formSelect.disabledNote")}
        code={`<SelectItem value="banana" disabled>Banana (out of stock)</SelectItem>

<Select disabled>
  <SelectTrigger className="w-full"><SelectValue placeholder="Disabled" /></SelectTrigger>
</Select>`}
      >
        <div className="grid w-full gap-3 sm:max-w-md sm:grid-cols-2">
          <Select defaultValue="apple">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana" disabled>
                Banana (out of stock)
              </SelectItem>
              <SelectItem value="cherry">Cherry</SelectItem>
            </SelectContent>
          </Select>
          <Select disabled>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("showcase.s.disabled")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
