import { CheckCircle2, LogIn } from "lucide-react";
import { devDebug } from "@/lib/debug";
import { Link, useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /auth-success + cover (public): a generic success confirmation. The message is
 * chosen by the ?message= query param (signup / verify / reset), falling back to
 * a default when absent or unknown.
 */

const MESSAGES = new Set(["signup", "verify", "reset", "default"]);

export function AuthSuccessPage() {
  useLocale();
  const [params] = useSearchParams();
  const message = params.get("message") ?? "default";
  const key = MESSAGES.has(message) ? message : "default";
  devDebug("[AuthSuccessPage] render", { message: key });

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
          <CheckCircle2 className="size-7" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight">
            {t(`auth.success.${key}.title`)}
          </h1>
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">
            {t(`auth.success.${key}.subtitle`)}
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login">
            <LogIn className="size-4" />
            {t("auth.success.cta")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
