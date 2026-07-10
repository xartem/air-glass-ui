import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Basic form elements showcase (W5): Input, Textarea and Label wrapped in the
 * shared FormField — the size scale, states, disabled and the aria-invalid error
 * path. Static demos; chrome via t(), code samples literal.
 */
export function BasicElementsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.forms.basicElements.title")}
      description={t("showcase.forms.basicElements.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.s.basic")}
        previewClassName="block"
        code={`<FormField name="name" label="Full name" required help="As it appears on your ID.">
  <Input id="name" placeholder="Jane Cooper" />
</FormField>
<FormField name="bio" label="About">
  <Textarea id="bio" rows={3} placeholder="A few words…" />
</FormField>`}
      >
        <div className="w-full max-w-md space-y-4">
          <FormField
            name="basic-name"
            label={t("showcase.forms.validation.name")}
            required
            help={t("showcase.forms.basicElements.nameHelp")}
          >
            <Input id="basic-name" placeholder="Jane Cooper" />
          </FormField>
          <FormField name="basic-bio" label={t("uikit.field.description")}>
            <Textarea
              id="basic-bio"
              rows={3}
              placeholder={t("showcase.forms.basicElements.bioPlaceholder")}
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.sizes")}
        previewClassName="block"
        notes={t("showcase.forms.basicElements.sizesNote")}
        code={`<Input inputSize="sm" placeholder="sm / 32px" />
<Input inputSize="default" placeholder="default / 38px" />
<Input inputSize="lg" placeholder="lg / 42px" />`}
      >
        <div className="w-full space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Input inputSize="sm" placeholder="sm / 32px" />
            <Input inputSize="default" placeholder="default / 38px" />
            <Input inputSize="lg" placeholder="lg / 42px" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Textarea inputSize="sm" rows={2} placeholder="sm" />
            <Textarea inputSize="default" rows={2} placeholder="default" />
            <Textarea inputSize="lg" rows={2} placeholder="lg" />
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.s.withError")}
        previewClassName="block"
        notes={t("showcase.forms.basicElements.errorNote")}
        code={`<FormField name="email" label="Email" required error="Enter a valid email.">
  <Input id="email" defaultValue="not-an-email" />
</FormField>`}
      >
        <div className="w-full max-w-md">
          <FormField
            name="basic-email"
            label={t("uikit.field.email")}
            required
            error={t("showcase.forms.validation.emailError")}
          >
            <Input id="basic-email" defaultValue="not-an-email" />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.disabled")}
        previewClassName="block"
        code={`<Label htmlFor="ro">Read only</Label>
<Input id="ro" defaultValue="Locked value" readOnly />

<Label htmlFor="dis">Disabled</Label>
<Input id="dis" defaultValue="Disabled value" disabled />`}
      >
        <div className="w-full max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="basic-readonly">
              {t("showcase.forms.basicElements.readOnly")}
            </Label>
            <Input id="basic-readonly" defaultValue="Locked value" readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="basic-disabled">{t("showcase.s.disabled")}</Label>
            <Input id="basic-disabled" defaultValue="Disabled value" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="basic-disabled-ta">
              {t("showcase.s.disabled")}
            </Label>
            <Textarea
              id="basic-disabled-ta"
              rows={2}
              defaultValue="Disabled textarea"
              disabled
            />
          </div>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
