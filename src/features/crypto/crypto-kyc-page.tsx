import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, type KycStatus } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { StatusBadge, type StatusKind } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
} from "@/components/ui/stepper";
import { t } from "@/lib/i18n";

/*
 * /crypto/kyc — identity verification across an Identity → Documents → Review →
 * Submitted stepper, with a status banner. Reachable with crypto.view.
 */

const STATUS_KIND: Record<KycStatus, StatusKind> = {
  unverified: "draft",
  pending: "pending",
  approved: "success",
  rejected: "error",
};
const STEP_KEYS = ["identity", "documents", "review", "submitted"] as const;
const COUNTRIES = ["US", "CA", "GB", "DE", "FR"];
const DOC_KEYS = ["front", "back", "selfie"] as const;

const identitySchema = z.object({
  full_name: z.string().min(1, "required"),
  dob: z.string().min(1, "required"),
  country: z.string().min(1, "required"),
  id_number: z.string().min(1, "required"),
});
type IdentityValues = z.infer<typeof identitySchema>;
type Documents = Record<(typeof DOC_KEYS)[number], string>;

export function CryptoKycPage() {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<KycStatus>("unverified");
  const [documents, setDocuments] = useState<Documents>({
    front: "",
    back: "",
    selfie: "",
  });
  const [docError, setDocError] = useState(false);

  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    defaultValues: { full_name: "", dob: "", country: "US", id_number: "" },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const payload = { ...form.getValues(), documents };
      console.debug("[CryptoKyc] submit", { country: payload.country });
      return api.crypto.submitKyc(payload);
    },
    onSuccess: (application) => {
      setStatus(application.status);
      toast.success(t("crypto.kyc.submitted"));
      setStep(3);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  async function next() {
    if (step === 0) {
      const valid = await form.trigger();
      if (!valid) return;
    }
    if (step === 1) {
      const complete = DOC_KEYS.every((key) => documents[key]);
      setDocError(!complete);
      if (!complete) return;
    }
    if (step === 2) {
      submitMutation.mutate();
      return;
    }
    console.debug("[CryptoKyc] step", { from: step, to: step + 1 });
    setStep((current) => Math.min(STEP_KEYS.length - 1, current + 1));
  }

  const values = form.watch();

  return (
    <div className="space-y-4">
      <PageHeader title={t("crypto.kyc.title")} icon={ShieldCheck} />

      <div className="glass-card flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div>
          <div className="text-sm font-medium">
            {t("crypto.kyc.status_label")}
          </div>
          <div className="text-xs text-muted-foreground">
            {t(`crypto.kyc.status_hint.${status}`)}
          </div>
        </div>
        <StatusBadge
          status={STATUS_KIND[status]}
          label={t(`crypto.kyc_status.${status}`)}
        />
      </div>

      <Panel>
        <Stepper activeStep={step}>
          {STEP_KEYS.map((key, index) => (
            <StepperItem key={key} index={index}>
              <StepperIndicator>{index + 1}</StepperIndicator>
              <div className="hidden sm:block">
                <StepperTitle>{t(`crypto.kyc.step.${key}`)}</StepperTitle>
                <StepperDescription>
                  {t("crypto.kyc.step_n", { n: index + 1 })}
                </StepperDescription>
              </div>
              <StepperSeparator />
            </StepperItem>
          ))}
        </Stepper>
      </Panel>

      <Panel title={t(`crypto.kyc.step.${STEP_KEYS[step]}`)}>
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="full_name"
              label={t("crypto.kyc.field.full_name")}
              required
              error={
                form.formState.errors.full_name &&
                t("crypto.kyc.error.required")
              }
            >
              <Input id="full_name" {...form.register("full_name")} />
            </FormField>
            <FormField
              name="dob"
              label={t("crypto.kyc.field.dob")}
              required
              error={
                form.formState.errors.dob && t("crypto.kyc.error.required")
              }
            >
              <Input id="dob" type="date" {...form.register("dob")} />
            </FormField>
            <FormField name="country" label={t("crypto.kyc.field.country")}>
              <Select
                value={form.watch("country")}
                onValueChange={(value) =>
                  form.setValue("country", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="country" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {t(`crypto.kyc.country.${code}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              name="id_number"
              label={t("crypto.kyc.field.id_number")}
              required
              error={
                form.formState.errors.id_number &&
                t("crypto.kyc.error.required")
              }
            >
              <Input id="id_number" {...form.register("id_number")} />
            </FormField>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {DOC_KEYS.map((key) => (
                <FileUploadField
                  key={key}
                  label={t(`crypto.kyc.doc.${key}`)}
                  fileName={documents[key]}
                  onFile={(name) => {
                    setDocuments((current) => ({ ...current, [key]: name }));
                    setDocError(false);
                  }}
                />
              ))}
            </div>
            {docError ? (
              <p className="text-sm text-destructive">
                {t("crypto.kyc.error.documents")}
              </p>
            ) : null}
          </div>
        ) : step === 2 ? (
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <ReviewRow
              label={t("crypto.kyc.field.full_name")}
              value={values.full_name || "—"}
            />
            <ReviewRow
              label={t("crypto.kyc.field.dob")}
              value={values.dob || "—"}
            />
            <ReviewRow
              label={t("crypto.kyc.field.country")}
              value={
                values.country ? t(`crypto.kyc.country.${values.country}`) : "—"
              }
            />
            <ReviewRow
              label={t("crypto.kyc.field.id_number")}
              value={values.id_number || "—"}
            />
            <ReviewRow
              label={t("crypto.kyc.documents")}
              value={
                DOC_KEYS.map((key) => documents[key])
                  .filter(Boolean)
                  .join(", ") || "—"
              }
              className="sm:col-span-2"
            />
          </dl>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgeCheck className="size-7" />
            </span>
            <h3 className="text-lg font-semibold">
              {t("crypto.kyc.done_title")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("crypto.kyc.done_hint")}
            </p>
            <StatusBadge
              status={STATUS_KIND.pending}
              label={t("crypto.kyc_status.pending")}
            />
          </div>
        )}

        {step < 3 ? (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((current) => Math.max(0, current - 1))}
            >
              {t("common.back")}
            </Button>
            <Button onClick={next} disabled={submitMutation.isPending}>
              {step === 2 ? t("crypto.kyc.submit") : t("wizard.next")}
            </Button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function FileUploadField({
  label,
  fileName,
  onFile,
}: {
  label: string;
  fileName: string;
  onFile: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <div className="text-sm font-medium">{label}</div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-input px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        <Upload className="size-5" />
        <span className="truncate">
          {fileName || t("crypto.kyc.upload_hint")}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
    </div>
  );
}

function ReviewRow({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
