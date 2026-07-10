import { useState } from "react";
import { Plus } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
} from "@/components/ui/stepper";
import { WizardDialog } from "@/components/wizard-dialog";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Wizard showcase (W5): the standalone Stepper indicator wired to interactive
 * next/prev state, plus the shared WizardDialog (the modal step shell). Both are
 * the canonical primitives — screens compose these, never a bespoke wizard.
 */
export function WizardPage() {
  useLocale();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: t("showcase.forms.wizard.s1"),
      description: t("showcase.forms.wizard.s1Desc"),
    },
    {
      title: t("showcase.forms.wizard.s2"),
      description: t("showcase.forms.wizard.s2Desc"),
    },
    {
      title: t("showcase.forms.wizard.s3"),
      description: t("showcase.forms.wizard.s3Desc"),
    },
  ];
  const isLast = step === steps.length - 1;

  return (
    <ShowcasePage
      title={t("showcase.forms.wizard.title")}
      description={t("showcase.forms.wizard.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title="Stepper"
        previewClassName="block"
        notes={t("showcase.forms.wizard.stepperNote")}
        code={`const [step, setStep] = useState(0);

<Stepper activeStep={step}>
  {steps.map((s, i) => (
    <StepperItem key={s.title} index={i}>
      <StepperIndicator>{i + 1}</StepperIndicator>
      <StepperTitle>{s.title}</StepperTitle>
      <StepperSeparator />
    </StepperItem>
  ))}
</Stepper>`}
      >
        <div className="w-full space-y-6">
          <Stepper activeStep={step}>
            {steps.map((item, index) => (
              <StepperItem key={item.title} index={index}>
                <StepperIndicator>{index + 1}</StepperIndicator>
                <div className="hidden sm:block">
                  <StepperTitle>{item.title}</StepperTitle>
                  <StepperDescription>{item.description}</StepperDescription>
                </div>
                <StepperSeparator />
              </StepperItem>
            ))}
          </Stepper>

          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            {isLast
              ? t("showcase.forms.wizard.done")
              : `${steps[step]?.title} — ${steps[step]?.description}`}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              {t("common.back")}
            </Button>
            {isLast ? (
              <Button
                size="sm"
                onClick={() => {
                  toast.success(t("showcase.forms.wizard.finishToast"));
                  setStep(0);
                }}
              >
                {t("wizard.finish")}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() =>
                  setStep((current) =>
                    Math.min(steps.length - 1, current + 1),
                  )
                }
              >
                {t("wizard.next")}
              </Button>
            )}
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo
        title="Wizard dialog"
        previewClassName="block"
        notes={t("showcase.forms.wizard.dialogNote")}
        code={`<WizardDialog
  trigger={<Button><Plus />New project</Button>}
  title="New project"
  onFinish={() => toast.success("Project created")}
  steps={[
    { key: "basics", label: "Basics", content: <…/> },
    { key: "options", label: "Options", content: <…/> },
    { key: "confirm", label: "Confirm", content: <…/> },
  ]}
/>`}
      >
        <WizardDialog
          trigger={
            <Button>
              <Plus />
              {t("showcase.forms.wizard.open")}
            </Button>
          }
          title={t("showcase.forms.wizard.open")}
          onFinish={() => toast.success(t("showcase.forms.wizard.finishToast"))}
          steps={[
            {
              key: "basics",
              label: t("showcase.forms.wizard.s1"),
              content: (
                <div className="grid gap-4">
                  <FormField
                    name="wiz-name"
                    label={t("uikit.field.title")}
                    required
                  >
                    <Input id="wiz-name" placeholder="Acme website" />
                  </FormField>
                  <FormField name="wiz-slug" label={t("uikit.field.slug")}>
                    <Input id="wiz-slug" placeholder="acme-website" />
                  </FormField>
                </div>
              ),
            },
            {
              key: "options",
              label: t("showcase.forms.wizard.s2"),
              content: (
                <div className="grid gap-3">
                  <div className="flex items-center gap-2">
                    <Switch id="wiz-public" defaultChecked />
                    <Label htmlFor="wiz-public">
                      {t("showcase.forms.wizard.optionPublic")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="wiz-analytics" />
                    <Label htmlFor="wiz-analytics">
                      {t("showcase.forms.wizard.optionAnalytics")}
                    </Label>
                  </div>
                </div>
              ),
            },
            {
              key: "confirm",
              label: t("showcase.forms.wizard.s3"),
              content: (
                <p className="text-sm text-muted-foreground">
                  {t("showcase.forms.wizard.confirmHint")}
                </p>
              ),
            },
          ]}
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
