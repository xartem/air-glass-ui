import { useState, type FormEvent } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Link } from "react-router";

import { api } from "@/api";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /forgot (UI:shell-auth §2): the success screen is IDENTICAL for any email —
 * including rate-limited attempts (anti-enumeration, D:auth §14).
 */

export function ForgotPage() {
  useLocale();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api.auth.forgot(email);
    } catch {
      /* rate-limit and errors show the same neutral screen */
    } finally {
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-lg">
          {t("forgot.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <MailCheck className="size-10 text-primary" />
            <p className="text-sm text-muted-foreground">{t("forgot.sent")}</p>
            <Button variant="link" size="sm" asChild>
              <Link to="/login">
                <ArrowLeft className="size-4" />
                {t("forgot.back_to_login")}
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <p className="text-sm text-muted-foreground">{t("forgot.hint")}</p>
            <FormField name="forgot-email" label={t("login.email")} required>
              <Input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              disabled={busy || email.length === 0}
            >
              {busy ? <Spinner /> : null}
              {t("forgot.submit")}
            </Button>
            <p className="text-center">
              <Button variant="link" size="sm" asChild>
                <Link to="/login">{t("forgot.back_to_login")}</Link>
              </Button>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
