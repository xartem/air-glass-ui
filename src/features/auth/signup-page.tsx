import { Eye, EyeOff, UserPlus } from "lucide-react";
import { devDebug } from "@/lib/debug";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { api, ValidationError } from "@/api";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * /signup + /signup/cover: demo account creation (mock — nothing persists). The
 * password field shows a live strength meter; "taken@example.com" surfaces the
 * server-side email-taken error so the failure path is reviewable on mock data.
 */

const schema = z
  .object({
    name: z.string().min(1, "required"),
    email: z.string().min(1, "required").email("email"),
    password: z.string().min(8, "min"),
    confirm: z.string().min(1, "required"),
    terms: z.literal(true),
  })
  .refine((values) => values.password === values.confirm, {
    path: ["confirm"],
    message: "mismatch",
  });

type FormValues = z.infer<typeof schema>;

/** 0–100 strength from length + character-class variety. */
function passwordStrength(value: string): number {
  if (!value) return 0;
  let score = Math.min(value.length, 12) * 5;
  if (/[a-z]/.test(value)) score += 10;
  if (/[A-Z]/.test(value)) score += 10;
  if (/\d/.test(value)) score += 10;
  if (/[^\w]/.test(value)) score += 10;
  return Math.min(100, score);
}

export function SignupPage() {
  useLocale();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
      terms: false as unknown as true,
    },
  });

  const strength = passwordStrength(watch("password"));
  const errorText = (key?: string) =>
    key ? t(`auth.signup.error.${key}`) : undefined;

  async function onSubmit(values: FormValues) {
    devDebug("[SignupPage] submit", { email: values.email });
    try {
      await api.auth.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate("/auth-success?message=signup", { replace: true });
    } catch (cause) {
      if (cause instanceof ValidationError && cause.fields.email) {
        devDebug("[SignupPage] email taken");
        setError("email", { message: "taken" });
      } else {
        setError("root", { message: t("common.request_failed") });
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <UserPlus className="size-6" />
          </span>
          <CardTitle className="text-lg">{t("auth.signup.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.signup.subtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {errors.root ? (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          ) : null}
          <FormField
            name="name"
            label={t("auth.signup.name")}
            required
            error={errorText(errors.name?.message)}
          >
            <Input
              id="name"
              autoComplete="name"
              autoFocus
              {...register("name")}
            />
          </FormField>
          <FormField
            name="email"
            label={t("auth.signup.email")}
            required
            error={errorText(errors.email?.message)}
          >
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>
          <FormField
            name="password"
            label={t("auth.signup.password")}
            required
            error={errorText(errors.password?.message)}
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="pe-9"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={t(
                  showPassword ? "login.hide_password" : "login.show_password",
                )}
                className="absolute inset-y-0 end-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </FormField>
          <div className="space-y-1.5">
            <Progress
              value={strength}
              className={cn(
                strength >= 70 &&
                  "[&>[data-slot=progress-indicator]]:bg-[var(--status-success-fg)]",
              )}
            />
            <p className="text-xs text-muted-foreground">
              {t("auth.signup.strength")}
            </p>
          </div>
          <FormField
            name="confirm"
            label={t("auth.signup.confirm")}
            required
            error={errorText(errors.confirm?.message)}
          >
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...register("confirm")}
            />
          </FormField>
          <Controller
            control={control}
            name="terms"
            render={({ field }) => (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                  aria-invalid={errors.terms ? true : undefined}
                />
                <Label htmlFor="terms" className="font-normal leading-snug">
                  {t("auth.signup.terms")}
                </Label>
              </div>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <UserPlus className="size-4" />}
            {t("auth.signup.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("auth.signup.haveAccount")}{" "}
            <Button variant="link" size="sm" asChild className="px-0">
              <Link to="/login">{t("auth.signup.signIn")}</Link>
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
