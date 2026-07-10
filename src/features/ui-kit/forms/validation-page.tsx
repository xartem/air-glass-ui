import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { FormField } from "@/components/form-field";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Validation showcase (W5): a LIVE React Hook Form + Zod form. zodResolver drives
 * per-field inline errors (rendered by FormField, WCAG 3.3.1), and a valid submit
 * toasts success then resets. Self-contained — nothing leaves the browser.
 */
export function ValidationPage() {
  useLocale();

  const schema = z.object({
    name: z.string().min(1, t("showcase.forms.validation.nameError")),
    email: z
      .string()
      .min(1, t("showcase.forms.validation.emailError"))
      .email(t("showcase.forms.validation.emailError")),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Simulate an async submit so the pending state is reviewable (no network).
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success(
      t("showcase.forms.validation.success", { name: values.name }),
    );
    reset();
  });

  return (
    <ShowcasePage
      title={t("showcase.forms.validation.title")}
      description={t("showcase.forms.validation.desc")}
      breadcrumb={{ group: t("nav.components.forms") }}
    >
      <ComponentDemo
        title={t("showcase.s.examples")}
        previewClassName="block"
        notes={t("showcase.forms.validation.note")}
        code={`const schema = z.object({
  name: z.string().min(1, "Please enter your name."),
  email: z.string().min(1, "…").email("Enter a valid email."),
});

const { register, handleSubmit, formState: { errors } } =
  useForm({ resolver: zodResolver(schema) });

<form onSubmit={handleSubmit(onSubmit)}>
  <FormField name="name" label="Full name" required error={errors.name?.message}>
    <Input id="name" {...register("name")} />
  </FormField>
</form>`}
      >
        <form
          onSubmit={onSubmit}
          noValidate
          className="w-full max-w-md space-y-4"
        >
          <FormField
            name="name"
            label={t("showcase.forms.validation.name")}
            required
            error={errors.name?.message}
          >
            <Input id="name" placeholder="Jane Cooper" {...register("name")} />
          </FormField>
          <FormField
            name="email"
            label={t("uikit.field.email")}
            required
            error={errors.email?.message}
          >
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              {...register("email")}
            />
          </FormField>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {t("showcase.forms.validation.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              {t("showcase.forms.validation.reset")}
            </Button>
          </div>
        </form>
      </ComponentDemo>
    </ShowcasePage>
  );
}
