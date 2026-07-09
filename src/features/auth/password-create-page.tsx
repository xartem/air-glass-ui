import { useState, type FormEvent } from "react";
import { devDebug } from "@/lib/debug";
import { Check, KeyRound, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { api } from "@/api";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/use-locale";

/*
 * /password-create + cover: first-time password set for an invite flow. A live
 * rules checklist and strength meter guide the input; submit hits the mock
 * createPassword endpoint and routes back to sign-in.
 */

const RULES = [
  { key: "length", test: (v: string) => v.length >= 8 },
  { key: "upper", test: (v: string) => /[A-Z]/.test(v) },
  { key: "lower", test: (v: string) => /[a-z]/.test(v) },
  { key: "number", test: (v: string) => /\d/.test(v) },
  { key: "symbol", test: (v: string) => /[^\w]/.test(v) },
] as const;

export function PasswordCreatePage() {
  useLocale();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const passed = RULES.filter((rule) => rule.test(password)).length;
  const strength = Math.round((passed / RULES.length) * 100);
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = passed === RULES.length && !mismatch && confirm.length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !canSubmit) return;
    setBusy(true);
    devDebug("[PasswordCreatePage] submit");
    try {
      await api.auth.createPassword({ password });
      devDebug("[PasswordCreatePage] created");
      toast.success(t("auth.passwordCreate.done"));
      navigate("/login", { replace: true });
    } catch {
      toast.error(t("common.request_failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <KeyRound className="size-6" />
          </span>
          <CardTitle className="text-lg">
            {t("auth.passwordCreate.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.passwordCreate.subtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            name="new-password"
            label={t("auth.passwordCreate.password")}
            required
          >
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              autoFocus
              required
            />
          </FormField>
          <div className="space-y-1.5">
            <Progress
              value={strength}
              className={cn(
                strength === 100 &&
                  "[&>[data-slot=progress-indicator]]:bg-[var(--status-success-fg)]",
              )}
            />
          </div>
          <ul className="grid gap-1.5">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.key} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full",
                      ok
                        ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {ok ? (
                      <Check className="size-2.5" />
                    ) : (
                      <X className="size-2.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      ok ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t(`auth.passwordCreate.rule.${rule.key}`)}
                  </span>
                </li>
              );
            })}
          </ul>
          <FormField
            name="confirm-password"
            label={t("auth.passwordCreate.confirm")}
            required
            error={mismatch ? t("auth.passwordCreate.mismatch") : undefined}
          >
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
            />
          </FormField>
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !canSubmit}
          >
            {busy ? <Spinner /> : null}
            {t("auth.passwordCreate.submit")}
          </Button>
          <p className="text-center">
            <Button variant="link" size="sm" asChild>
              <Link to="/login">{t("auth.passwordCreate.backToLogin")}</Link>
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
