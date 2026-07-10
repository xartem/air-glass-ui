import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { ColorPicker } from "@/components/color-picker";
import { DatePicker } from "@/components/date-picker";
import {
  DateRangePicker,
  type DateRangeValue,
} from "@/components/date-range-picker";
import { FormField } from "@/components/form-field";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Pickers showcase (W5): DatePicker, DateRangePicker and ColorPicker — every one
 * controlled through useState, values round-tripping as ISO strings / hex. The
 * calendar chrome follows the active admin locale automatically.
 */
export function PickersPage() {
  useLocale();
  const [date, setDate] = useState<string | undefined>("2026-07-10");
  const [range, setRange] = useState<DateRangeValue>({
    from: "2026-07-01",
    to: "2026-07-14",
  });
  const [color, setColor] = useState("#1d8df2");

  return (
    <ShowcasePage
      title={t("showcase.forms.pickers.title")}
      description={t("showcase.forms.pickers.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.pickers.date")}
        previewClassName="block"
        notes={t("showcase.forms.pickers.dateNote")}
        code={`const [date, setDate] = useState<string | undefined>("2026-07-10");

<DatePicker id="date" value={date} onChange={setDate} />`}
      >
        <div className="w-full max-w-xs">
          <FormField name="picker-date" label={t("showcase.forms.pickers.date")}>
            <DatePicker id="picker-date" value={date} onChange={setDate} />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.pickers.range")}
        previewClassName="block"
        code={`const [range, setRange] = useState<DateRangeValue>({ from: "2026-07-01", to: "2026-07-14" });

<DateRangePicker value={range} onChange={setRange} className="w-full" />`}
      >
        <div className="w-full max-w-sm">
          <FormField
            name="picker-range"
            label={t("showcase.forms.pickers.range")}
          >
            <DateRangePicker
              value={range}
              onChange={setRange}
              className="w-full"
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.pickers.color")}
        previewClassName="block"
        notes={t("showcase.forms.pickers.colorNote")}
        code={`const [color, setColor] = useState("#1d8df2");

<ColorPicker id="color" value={color} onChange={setColor} />`}
      >
        <div className="w-full max-w-xs">
          <FormField
            name="picker-color"
            label={t("showcase.forms.pickers.color")}
          >
            <ColorPicker id="picker-color" value={color} onChange={setColor} />
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
