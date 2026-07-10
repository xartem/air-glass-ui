import { useMutation } from "@tanstack/react-query";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FilePlus2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import {
  api,
  ValidationError,
  type JobCreatePayload,
  type JobDepartment,
  type JobStatus,
  type JobType,
} from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { RichTextEditor } from "@/components/rich-text-editor";
import { SaveBar } from "@/components/save-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberField } from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";

import { JOB_DEPARTMENTS, JOB_STATUSES, JOB_TYPES } from "./jobs-shared";

/*
 * /jobs/new — post a job via react-hook-form + Zod with a requirements repeater,
 * rich-text description and a SaveBar. Reachable with jobs.manage.
 */

const schema = z
  .object({
    title: z.string().min(1, "required"),
    department: z.enum([
      "engineering",
      "sales",
      "marketing",
      "design",
      "support",
    ]),
    type: z.enum([
      "full_time",
      "part_time",
      "contract",
      "internship",
      "temporary",
    ]),
    location: z.string().min(1, "required"),
    salary_min: z.number().min(0),
    salary_max: z.number().min(0),
    description: z.string(),
    requirements: z.array(z.object({ value: z.string() })),
    status: z.enum(["published", "draft", "closed", "archived"]),
  })
  .refine((values) => values.salary_max >= values.salary_min, {
    path: ["salary_max"],
    message: "invalid",
  });
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  title: "",
  department: "engineering",
  type: "full_time",
  location: "",
  salary_min: 60000,
  salary_max: 90000,
  description: "",
  requirements: [{ value: "" }],
  status: "draft",
};

export function JobsNewPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit, reset, setValue, watch, formState } =
    form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "requirements",
  });
  const values = watch();

  const saveMutation = useMutation({
    mutationFn: (formValues: FormValues) => {
      const payload: JobCreatePayload = {
        title: formValues.title,
        department: formValues.department,
        type: formValues.type,
        location: formValues.location,
        salary_min: formValues.salary_min,
        salary_max: formValues.salary_max,
        description: formValues.description,
        requirements: formValues.requirements
          .map((requirement) => requirement.value.trim())
          .filter(Boolean),
        status: formValues.status,
      };
      console.debug("[JobsNew] save", { title: payload.title });
      return api.jobs.create(payload);
    },
    onSuccess: (job) => {
      toast.success(t("jobs.new.saved", { title: job.title }));
      navigate(`/jobs/${job.id}`);
    },
    onError: (cause) => {
      if (cause instanceof ValidationError) {
        for (const field of Object.keys(cause.fields)) {
          form.setError(field as keyof FormValues, { message: "invalid" });
        }
        return;
      }
      toast.error(t("common.request_failed"));
    },
  });

  const onSubmit = (formValues: FormValues) => saveMutation.mutate(formValues);

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={t("jobs.new.title")}
        icon={FilePlus2}
        breadcrumbs={[
          { label: t("jobs.list.title"), href: "/jobs/list" },
          { label: t("jobs.new.title") },
        ]}
      />

      <Panel title={t("jobs.new.details")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="title"
            label={t("jobs.new.field.title")}
            required
            error={formState.errors.title && t("jobs.new.error.required")}
            className="sm:col-span-2"
          >
            <Input id="title" {...register("title")} />
          </FormField>

          <FormField name="department" label={t("jobs.new.field.department")}>
            <Select
              value={values.department}
              onValueChange={(value) =>
                setValue("department", value as JobDepartment, {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger id="department" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_DEPARTMENTS.map((department) => (
                  <SelectItem key={department} value={department}>
                    {t(`jobs.dept.${department}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField name="type" label={t("jobs.new.field.type")}>
            <Select
              value={values.type}
              onValueChange={(value) =>
                setValue("type", value as JobType, { shouldDirty: true })
              }
            >
              <SelectTrigger id="type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`jobs.type.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            name="location"
            label={t("jobs.new.field.location")}
            required
            error={formState.errors.location && t("jobs.new.error.required")}
          >
            <Input id="location" {...register("location")} />
          </FormField>

          <FormField name="status" label={t("jobs.new.field.status")}>
            <Select
              value={values.status}
              onValueChange={(value) =>
                setValue("status", value as JobStatus, { shouldDirty: true })
              }
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`jobs.status.${status}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField name="salary_min" label={t("jobs.new.field.salary_min")}>
            <Controller
              control={control}
              name="salary_min"
              render={({ field }) => (
                <NumberField
                  value={field.value}
                  min={0}
                  step={5000}
                  onValueChange={(value) => field.onChange(value ?? 0)}
                />
              )}
            />
          </FormField>

          <FormField
            name="salary_max"
            label={t("jobs.new.field.salary_max")}
            error={formState.errors.salary_max && t("jobs.new.error.salary")}
          >
            <Controller
              control={control}
              name="salary_max"
              render={({ field }) => (
                <NumberField
                  value={field.value}
                  min={0}
                  step={5000}
                  onValueChange={(value) => field.onChange(value ?? 0)}
                />
              )}
            />
          </FormField>

          <FormField
            name="description"
            label={t("jobs.new.field.description")}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>
        </div>
      </Panel>

      <Panel
        title={t("jobs.new.requirements")}
        description={t("jobs.new.requirements_hint")}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => append({ value: "" })}
          >
            <Plus />
            {t("jobs.new.add_requirement")}
          </Button>
        }
      >
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                aria-label={t("jobs.new.requirement")}
                placeholder={t("jobs.new.requirement_placeholder")}
                {...register(`requirements.${index}.value`)}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("common.delete")}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      </Panel>

      <SaveBar
        dirty={formState.isDirty}
        saving={saveMutation.isPending}
        onSave={() => void handleSubmit(onSubmit)()}
        onReset={() => reset(DEFAULTS)}
      />
    </div>
  );
}
