import { useState } from "react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { MaskedInput } from "@/components/masked-input";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Input masks showcase (W5): the MaskedInput control formatting keystrokes for
 * card / expiry / phone / amount masks. Each field is controlled through useState
 * and stores the already-formatted display string; unmask() recovers the raw
 * value at submit time (see src/lib/input-mask.ts).
 */
export function InputMasksPage() {
  useLocale();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [expiry, setExpiry] = useState("12/28");
  const [phone, setPhone] = useState("(415) 555-0132");
  const [amount, setAmount] = useState("1,234.5678");

  return (
    <ShowcasePage
      title={t("showcase.forms.inputMasks.title")}
      description={t("showcase.forms.inputMasks.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.forms.inputMasks.card")}
        previewClassName="block"
        notes={t("showcase.forms.inputMasks.cardNote")}
        code={`const [card, setCard] = useState("");

<MaskedInput mask="card" value={card} onChange={setCard} placeholder="0000 0000 0000 0000" />`}
      >
        <div className="w-full max-w-xs">
          <FormField
            name="mask-card"
            label={t("showcase.forms.inputMasks.card")}
          >
            <MaskedInput
              id="mask-card"
              mask="card"
              value={card}
              onChange={setCard}
              placeholder="0000 0000 0000 0000"
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.inputMasks.expiry")}
        previewClassName="block"
        code={`<MaskedInput mask="expiry" value={expiry} onChange={setExpiry} placeholder="MM/YY" />`}
      >
        <div className="w-full max-w-[8rem]">
          <FormField
            name="mask-expiry"
            label={t("showcase.forms.inputMasks.expiry")}
          >
            <MaskedInput
              id="mask-expiry"
              mask="expiry"
              value={expiry}
              onChange={setExpiry}
              placeholder="MM/YY"
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.inputMasks.phone")}
        previewClassName="block"
        code={`<MaskedInput mask="phone" value={phone} onChange={setPhone} placeholder="(000) 000-0000" />`}
      >
        <div className="w-full max-w-xs">
          <FormField
            name="mask-phone"
            label={t("showcase.forms.inputMasks.phone")}
          >
            <MaskedInput
              id="mask-phone"
              mask="phone"
              value={phone}
              onChange={setPhone}
              placeholder="(000) 000-0000"
            />
          </FormField>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.forms.inputMasks.amount")}
        previewClassName="block"
        notes={t("showcase.forms.inputMasks.amountNote")}
        code={`<MaskedInput mask="amount" value={amount} onChange={setAmount} placeholder="0.00" />`}
      >
        <div className="w-full max-w-xs">
          <FormField
            name="mask-amount"
            label={t("showcase.forms.inputMasks.amount")}
          >
            <MaskedInput
              id="mask-amount"
              mask="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </FormField>
        </div>
      </ComponentDemo>
    </ShowcasePage>
  );
}
