import { useEffect, useState, type FormEvent } from "react";
import { devDebug } from "@/lib/debug";
import { MailCheck } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { api, ValidationError } from "@/api";
import { OtpField } from "@/components/otp-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /verify + cover: standalone 6-digit code entry (distinct from the login MFA
 * challenge). Resend is rate-limited by a local cooldown; the demo code is
 * "123456" (see the auth mock). Submit hits api.auth.verifyOtp.
 */

const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;

export function VerifyPage() {
  useLocale();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function verify(value: string) {
    if (busy || value.length < CODE_LENGTH) return;
    setBusy(true);
    setInvalid(false);
    devDebug("[VerifyPage] submit");
    try {
      await api.auth.verifyOtp(value);
      devDebug("[VerifyPage] verified");
      navigate("/auth-success?message=verify", { replace: true });
    } catch (cause) {
      devDebug("[VerifyPage] invalid code");
      setInvalid(cause instanceof ValidationError);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  function resend() {
    if (cooldown > 0) return;
    devDebug("[VerifyPage] resend");
    setCooldown(RESEND_SECONDS);
    setCode("");
    setInvalid(false);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <MailCheck className="size-6" />
          </span>
          <CardTitle className="text-lg">{t("auth.verify.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.verify.subtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            void verify(code);
          }}
          className="space-y-4"
          noValidate
        >
          <OtpField
            value={code}
            onChange={(value) => {
              setCode(value);
              setInvalid(false);
            }}
            onComplete={(value) => void verify(value)}
            invalid={invalid}
            disabled={busy}
            autoFocus
            aria-label={t("auth.verify.title")}
          />
          {invalid ? (
            <p role="alert" className="text-center text-xs text-destructive">
              {t("auth.verify.invalid")}
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              {t("auth.verify.hint")}
            </p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={busy || code.length < CODE_LENGTH}
          >
            {busy ? <Spinner /> : null}
            {t("auth.verify.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {cooldown > 0 ? (
              t("auth.verify.resendIn", { seconds: cooldown })
            ) : (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0"
                onClick={resend}
              >
                {t("auth.verify.resend")}
              </Button>
            )}
          </p>
          <p className="text-center">
            <Button variant="link" size="sm" asChild>
              <Link to="/login">{t("common.back")}</Link>
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
