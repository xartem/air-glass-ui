import { useEffect, useRef, useState } from "react";
import { devDebug } from "@/lib/debug";
import { LogIn, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /logout + cover (public): clears the mock session on mount and confirms the
 * sign-out with a sign-in CTA and an auto-redirect countdown.
 */

const REDIRECT_SECONDS = 10;

export function LogoutPage() {
  useLocale();
  const navigate = useNavigate();
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    void api.auth
      .logout()
      .finally(() => devDebug("[LogoutPage] session cleared"));
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      navigate("/login", { replace: true });
      return;
    }
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, navigate]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <LogOut className="size-6" />
        </span>
        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("auth.logout.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("auth.logout.subtitle")}
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/login">
            <LogIn className="size-4" />
            {t("auth.logout.signIn")}
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("auth.logout.redirect", { seconds })}
        </p>
      </CardContent>
    </Card>
  );
}
