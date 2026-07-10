import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FolderKanban } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { api, type ProjectPayload, type ProjectStatus } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { FormField } from "@/components/form-field";
import { SaveBar } from "@/components/save-bar";
import { DatePicker } from "@/components/date-picker";
import { MultiSelect } from "@/components/multi-select";
import { RichTextEditor } from "@/components/rich-text-editor";
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

/*
 * /projects/new — create a project via react-hook-form + Zod with a SaveBar.
 * Reachable with projects.manage.
 */

const TEAM_OPTIONS = [
  { value: "1", label: "Anna Adminson" },
  { value: "2", label: "Evan Editor" },
  { value: "3", label: "Olivia Parker" },
  { value: "4", label: "David Fisher" },
  { value: "5", label: "Mary Cooper" },
  { value: "6", label: "Ian Walker" },
];
const STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "completed"];

const schema = z.object({
  name: z.string().min(1, "required"),
  client: z.string().min(1, "required"),
  description: z.string(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().min(0),
  team: z.array(z.string()),
  status: z.enum(["planning", "active", "on_hold", "completed"]),
  tags: z.string(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULTS: FormValues = {
  name: "",
  client: "",
  description: "",
  start_date: undefined,
  end_date: undefined,
  budget: 0,
  team: [],
  status: "planning",
  tags: "",
};

export function CreateProjectPage() {
  const navigate = useNavigate();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });
  const { register, control, handleSubmit, reset, formState } = form;

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: ProjectPayload = {
        name: values.name,
        client: values.client,
        description: values.description,
        start_date: values.start_date ?? "",
        end_date: values.end_date ?? "",
        budget: values.budget,
        team: values.team.map(Number),
        status: values.status,
        tags: values.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      console.debug("[CreateProjectPage] save", payload);
      return api.projects.create(payload);
    },
    onSuccess: (project) => {
      toast.success(t("projects.create.saved"));
      navigate(`/projects/${project.id}`);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const onSubmit = (values: FormValues) => saveMutation.mutate(values);

  return (
    <div className="space-y-4 pb-24">
      <PageHeader
        title={t("projects.create.title")}
        icon={FolderKanban}
        breadcrumbs={[
          { label: t("nav.projects"), href: "/projects" },
          { label: t("projects.create.title") },
        ]}
      />

      <Panel title={t("projects.create.details")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="name"
            label={t("projects.create.field.name")}
            required
            error={formState.errors.name && t("projects.create.error.required")}
          >
            <Input id="name" {...register("name")} />
          </FormField>
          <FormField
            name="client"
            label={t("projects.create.field.client")}
            required
            error={
              formState.errors.client && t("projects.create.error.required")
            }
          >
            <Input id="client" {...register("client")} />
          </FormField>

          <FormField
            name="description"
            label={t("projects.create.field.description")}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </FormField>

          <FormField
            name="start_date"
            label={t("projects.create.field.start")}
          >
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>
          <FormField name="end_date" label={t("projects.create.field.end")}>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FormField>

          <FormField name="budget" label={t("projects.create.field.budget")}>
            <Controller
              control={control}
              name="budget"
              render={({ field }) => (
                <NumberField
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? 0)}
                  min={0}
                />
              )}
            />
          </FormField>
          <FormField name="status" label={t("projects.create.field.status")}>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`projects.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>

          <FormField
            name="team"
            label={t("projects.create.field.team")}
            className="sm:col-span-2"
          >
            <Controller
              control={control}
              name="team"
              render={({ field }) => (
                <MultiSelect
                  options={TEAM_OPTIONS}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("projects.create.team_placeholder")}
                />
              )}
            />
          </FormField>

          <FormField
            name="tags"
            label={t("projects.create.field.tags")}
            help={t("projects.create.tags_help")}
            className="sm:col-span-2"
          >
            <Input id="tags" {...register("tags")} />
          </FormField>
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
