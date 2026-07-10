import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { api, type ApplicationPayload } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
 * /jobs/application — apply to a job across a Personal → Resume → Questions →
 * Submitted stepper (react-hook-form + Zod per step, mock file upload + rich-text
 * cover letter). Reachable with jobs.view.
 */

const STEP_KEYS = ["personal", "resume", "questions", "submitted"] as const;
const QUESTION_KEYS = ["notice", "salary", "motivation"] as const;

const schema = z.object({
  first_name: z.string().min(1, "required"),
  last_name: z.string().min(1, "required"),
  email: z.string().email("invalid"),
  phone: z.string().min(1, "required"),
  portfolio: z.string(),
  linkedin: z.string(),
  cover_letter: z.string(),
  answers: z.array(z.string()),
});
type FormValues = z.infer<typeof schema>;

export function JobsApplicationPage() {
  const [step, setStep] = useState(0);
  const [resume, setResume] = useState("");
  const [resumeError, setResumeError] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      portfolio: "",
      linkedin: "",
      cover_letter: "",
      answers: QUESTION_KEYS.map(() => ""),
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const values = form.getValues();
      const payload: ApplicationPayload = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        portfolio: values.portfolio,
        linkedin: values.linkedin,
        resume,
        cover_letter: values.cover_letter,
        answers: QUESTION_KEYS.map((key, index) => ({
          question: t(`jobs.application.question.${key}`),
          answer: values.answers[index] ?? "",
        })),
      };
      console.debug("[JobsApplication] submit", { email: payload.email });
      return api.jobs.apply(payload);
    },
    onSuccess: () => {
      toast.success(t("jobs.application.submitted"));
      setStep(3);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  async function next() {
    if (step === 0) {
      const valid = await form.trigger([
        "first_name",
        "last_name",
        "email",
        "phone",
      ]);
      if (!valid) return;
    }
    if (step === 1) {
      if (!resume) {
        setResumeError(true);
        return;
      }
    }
    if (step === 2) {
      submitMutation.mutate();
      return;
    }
    console.debug("[JobsApplication] step", { from: step, to: step + 1 });
    setStep((current) => Math.min(STEP_KEYS.length - 1, current + 1));
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("jobs.application.title")} icon={FileText} />

      <Panel>
        <Stepper activeStep={step}>
          {STEP_KEYS.map((key, index) => (
            <StepperItem key={key} index={index}>
              <StepperIndicator>{index + 1}</StepperIndicator>
              <div className="hidden sm:block">
                <StepperTitle>{t(`jobs.application.step.${key}`)}</StepperTitle>
                <StepperDescription>
                  {t("jobs.application.step_n", { n: index + 1 })}
                </StepperDescription>
              </div>
              <StepperSeparator />
            </StepperItem>
          ))}
        </Stepper>
      </Panel>

      <Panel title={t(`jobs.application.step.${STEP_KEYS[step]}`)}>
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              name="first_name"
              label={t("jobs.application.field.first_name")}
              required
              error={
                form.formState.errors.first_name &&
                t("jobs.application.error.required")
              }
            >
              <Input id="first_name" {...form.register("first_name")} />
            </FormField>
            <FormField
              name="last_name"
              label={t("jobs.application.field.last_name")}
              required
              error={
                form.formState.errors.last_name &&
                t("jobs.application.error.required")
              }
            >
              <Input id="last_name" {...form.register("last_name")} />
            </FormField>
            <FormField
              name="email"
              label={t("jobs.application.field.email")}
              required
              error={
                form.formState.errors.email && t("jobs.application.error.email")
              }
            >
              <Input id="email" type="email" {...form.register("email")} />
            </FormField>
            <FormField
              name="phone"
              label={t("jobs.application.field.phone")}
              required
              error={
                form.formState.errors.phone &&
                t("jobs.application.error.required")
              }
            >
              <Input id="phone" {...form.register("phone")} />
            </FormField>
            <FormField
              name="portfolio"
              label={t("jobs.application.field.portfolio")}
            >
              <Input
                id="portfolio"
                placeholder="https://…"
                {...form.register("portfolio")}
              />
            </FormField>
            <FormField
              name="linkedin"
              label={t("jobs.application.field.linkedin")}
            >
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/…"
                {...form.register("linkedin")}
              />
            </FormField>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-sm font-medium">
                {t("jobs.application.field.resume")}
              </div>
              <ResumeUpload
                fileName={resume}
                onFile={(name) => {
                  setResume(name);
                  setResumeError(false);
                }}
              />
              {resumeError ? (
                <p className="text-sm text-destructive">
                  {t("jobs.application.error.resume")}
                </p>
              ) : null}
            </div>
            <FormField
              name="cover_letter"
              label={t("jobs.application.field.cover_letter")}
            >
              <Controller
                control={form.control}
                name="cover_letter"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("jobs.application.cover_letter_placeholder")}
                  />
                )}
              />
            </FormField>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4">
            {QUESTION_KEYS.map((key, index) => (
              <FormField
                key={key}
                name={`answers.${index}`}
                label={t(`jobs.application.question.${key}`)}
              >
                <Textarea
                  id={`answers.${index}`}
                  rows={3}
                  {...form.register(`answers.${index}` as const)}
                />
              </FormField>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <BadgeCheck className="size-7" />
            </span>
            <h3 className="text-lg font-semibold">
              {t("jobs.application.done_title")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("jobs.application.done_hint")}
            </p>
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
              {step === 2 ? t("jobs.application.submit") : t("wizard.next")}
            </Button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function ResumeUpload({
  fileName,
  onFile,
}: {
  fileName: string;
  onFile: (name: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-input px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:bg-accent/40"
      >
        <Upload className="size-5" />
        <span className="truncate">
          {fileName || t("jobs.application.resume_hint")}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        aria-label={t("jobs.application.field.resume")}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
    </>
  );
}
