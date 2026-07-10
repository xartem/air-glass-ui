import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Form layouts showcase (W5): the same FormField primitive arranged three ways —
 * a label-beside-control horizontal form, a single-row inline filter, and a
 * responsive two-column grid. Layout is pure Tailwind grid/flex utilities on the
 * shared field wrapper; no new field components.
 */
export function FormLayoutsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.forms.formLayouts.title")}
      description={t("showcase.forms.formLayouts.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.horizontal")}
        previewClassName="block"
        notes={t("showcase.forms.formLayouts.horizontalNote")}
        code={`<FormField
  name="title"
  label="Title"
  className="sm:grid sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-x-4 sm:space-y-0"
>
  <Input id="title" />
</FormField>`}
      >
        <div className="w-full max-w-2xl space-y-4">
          <FormField
            name="hz-title"
            label={t("uikit.field.title")}
            required
            className="sm:grid sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-x-4 sm:space-y-0"
          >
            <Input id="hz-title" placeholder="Acme website" />
          </FormField>
          <FormField
            name="hz-category"
            label={t("uikit.field.category")}
            className="sm:grid sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-x-4 sm:space-y-0"
          >
            <Select defaultValue="marketing">
              <SelectTrigger id="hz-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            name="hz-notes"
            label={t("uikit.field.description")}
            className="sm:grid sm:grid-cols-[10rem_1fr] sm:items-start sm:gap-x-4 sm:space-y-0"
          >
            <Textarea id="hz-notes" rows={3} />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.inline")}
        previewClassName="block"
        notes={t("showcase.forms.formLayouts.inlineNote")}
        code={`<form className="flex flex-wrap items-end gap-3">
  <FormField name="q" label="Search"><Input id="q" /></FormField>
  <FormField name="status" label="Status"><Select>…</Select></FormField>
  <Button>Apply</Button>
</form>`}
      >
        <form className="flex w-full flex-wrap items-end gap-3">
          <FormField
            name="il-q"
            label={t("common.search")}
            className="min-w-48 flex-1"
          >
            <Input id="il-q" placeholder="Keyword…" />
          </FormField>
          <FormField name="il-status" label={t("common.status")}>
            <Select defaultValue="all">
              <SelectTrigger id="il-status" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <Button type="button">{t("showcase.forms.formLayouts.apply")}</Button>
        </form>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.grid")}
        previewClassName="block"
        notes={t("showcase.forms.formLayouts.gridNote")}
        code={`<div className="grid gap-4 sm:grid-cols-2">
  <FormField name="first" label="First name"><Input id="first" /></FormField>
  <FormField name="last" label="Last name"><Input id="last" /></FormField>
  <FormField name="email" label="Email" className="sm:col-span-2">
    <Input id="email" type="email" />
  </FormField>
</div>`}
      >
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <FormField
            name="gl-first"
            label={t("showcase.forms.formLayouts.first")}
          >
            <Input id="gl-first" placeholder="Jane" />
          </FormField>
          <FormField
            name="gl-last"
            label={t("showcase.forms.formLayouts.last")}
          >
            <Input id="gl-last" placeholder="Cooper" />
          </FormField>
          <FormField
            name="gl-email"
            label={t("uikit.field.email")}
            className="sm:col-span-2"
          >
            <Input id="gl-email" type="email" placeholder="jane@example.com" />
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
