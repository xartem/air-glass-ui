import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { api, ApiError, ValidationError } from "@/api";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /login (UI:shell-auth §2): glass card over the mesh. All feedback is inline —
 * no toasts. The throttle banner never reveals whether the email exists
 * (anti-enumeration, D:auth §14).
 */

export function LoginPage() {
  useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [throttled, setThrottled] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  // 2FA step (D:auth §6): password accepted → the same card asks for a code.
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");

  function done() {
    navigate(searchParams.get("return") ?? "/", { replace: true });
  }

  function fail(cause: unknown) {
    if (
      cause instanceof ApiError &&
      (cause.status === 429 || cause.code === "throttled")
    ) {
      setThrottled(true);
    } else if (cause instanceof ValidationError) {
      setFieldError(
        t(mfaStep ? "login.invalid_code" : "login.invalid_credentials"),
      );
    } else {
      setFieldError(t("common.request_failed"));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setThrottled(false);
    setFieldError(null);
    try {
      const result = await api.auth.login({ email, password, remember });
      if ("mfa_required" in result) setMfaStep(true);
      else done();
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setThrottled(false);
    setFieldError(null);
    try {
      await api.auth.challenge2fa(mfaCode.trim());
      done();
    } catch (cause) {
      fail(cause);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            U
          </span>
          <CardTitle className="text-lg">{t("login.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {mfaStep ? (
          <form onSubmit={submitCode} className="space-y-4" noValidate>
            {throttled ? (
              <Alert variant="destructive">
                <AlertDescription>{t("login.throttled")}</AlertDescription>
              </Alert>
            ) : null}
            <FormField
              name="mfa-code"
              label={t("login.mfa_code")}
              help={t("login.mfa_hint")}
              error={fieldError ?? undefined}
              required
            >
              <Input
                id="mfa-code"
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                required
                className="font-mono"
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              disabled={busy || mfaCode.trim().length === 0}
            >
              {busy ? <Spinner /> : <Lock className="size-4" />}
              {t("login.mfa_submit")}
            </Button>
            <p className="text-center">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  setMfaStep(false);
                  setMfaCode("");
                  setFieldError(null);
                }}
              >
                {t("common.back")}
              </Button>
            </p>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {throttled ? (
              <Alert variant="destructive">
                <AlertDescription>{t("login.throttled")}</AlertDescription>
              </Alert>
            ) : null}
            <FormField name="email" label={t("login.email")} required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </FormField>
            <FormField
              name="password"
              label={t("login.password")}
              required
              error={fieldError ?? undefined}
            >
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  className="pe-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={t(
                    showPassword
                      ? "login.hide_password"
                      : "login.show_password",
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <Label htmlFor="remember" className="font-normal">
                {t("login.remember")}
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Spinner /> : <Lock className="size-4" />}
              {t("login.submit")}
            </Button>
            <p className="text-center">
              <Button variant="link" size="sm" asChild>
                <Link to="/forgot">{t("login.forgot")}</Link>
              </Button>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
