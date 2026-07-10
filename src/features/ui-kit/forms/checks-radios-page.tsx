import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { SwitchRow } from "@/components/switch-row";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

function SettingsRowsDemo() {
  const [notifications, setNotifications] = useState(true);
  const [twofa, setTwofa] = useState(false);
  return (
    <div className="w-full max-w-lg space-y-2">
      <SwitchRow
        label={t("showcase.forms.checksRadios.notifLabel")}
        hint={t("showcase.forms.checksRadios.notifHint")}
        checked={notifications}
        onCheckedChange={setNotifications}
      />
      <SwitchRow
        label={t("showcase.forms.checksRadios.twofaLabel")}
        hint={t("showcase.forms.checksRadios.twofaHint")}
        checked={twofa}
        onCheckedChange={setTwofa}
      />
    </div>
  );
}

/*
 * Checkboxes, radios and switches showcase (W5): the boolean/choice controls
 * across checked, indeterminate, disabled states. Static demos with
 * defaultChecked / defaultValue — no controlled state needed.
 */
export function ChecksRadiosPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.forms.checksRadios.title")}
      description={t("showcase.forms.checksRadios.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title="Checkbox"
        previewClassName="block"
        code={`<Checkbox id="a" defaultChecked />
<Checkbox id="b" />
<Checkbox id="c" checked="indeterminate" />
<Checkbox id="d" defaultChecked disabled />`}
      >
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="cb-checked" defaultChecked />
            <Label htmlFor="cb-checked">
              {t("showcase.forms.checksRadios.checked")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-unchecked" />
            <Label htmlFor="cb-unchecked">
              {t("showcase.forms.checksRadios.unchecked")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-indeterminate" checked="indeterminate" />
            <Label htmlFor="cb-indeterminate">
              {t("showcase.forms.checksRadios.indeterminate")}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="cb-disabled" defaultChecked disabled />
            <Label htmlFor="cb-disabled">{t("showcase.s.disabled")}</Label>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title="Radio group"
        previewClassName="block"
        code={`<RadioGroup defaultValue="standard">
  <RadioGroupItem value="standard" id="r1" />
  <RadioGroupItem value="express" id="r2" />
  <RadioGroupItem value="pickup" id="r3" disabled />
</RadioGroup>`}
      >
        <RadioGroup defaultValue="standard" className="w-full max-w-xs">
          {[
            { value: "standard", label: "Standard shipping" },
            { value: "express", label: "Express shipping" },
            { value: "pickup", label: "Local pickup", disabled: true },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`radio-${option.value}`}
                disabled={option.disabled}
              />
              <Label htmlFor={`radio-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </ComponentDemo>

      <ComponentDemo
        title="Switch"
        previewClassName="block"
        code={`<Switch id="s1" defaultChecked />
<Switch id="s2" />
<Switch id="s3" size="sm" defaultChecked />
<Switch id="s4" defaultChecked disabled />`}
      >
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2">
            <Switch id="sw-on" defaultChecked />
            <Label htmlFor="sw-on">{t("showcase.forms.checksRadios.on")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sw-off" />
            <Label htmlFor="sw-off">{t("showcase.forms.checksRadios.off")}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sw-sm" size="sm" defaultChecked />
            <Label htmlFor="sw-sm">{t("showcase.s.sizes")} · sm</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sw-disabled" defaultChecked disabled />
            <Label htmlFor="sw-disabled">{t("showcase.s.disabled")}</Label>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.examples")}
        previewClassName="block"
        notes={t("showcase.forms.checksRadios.rowNote")}
        code={`<SwitchRow label="Email notifications" hint="Weekly digest and mentions." defaultChecked />
<SwitchRow label="Two-factor auth" hint="Require a code on sign-in." />`}
      >
        <SettingsRowsDemo />
      </ComponentDemo>
    </ShowcasePage>
  );
}
