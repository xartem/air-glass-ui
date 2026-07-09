import { useState, type FormEvent } from "react";
import { devDebug } from "@/lib/debug";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useNavigate } from "react-router";

import { api, ValidationError } from "@/api";
import { FormField } from "@/components/form-field";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";
import { t } from "@/lib/i18n";

/*
 * /lock + cover: re-auth without losing the session identity. Renders the
 * current user's name/avatar (from /me) and asks only for the password. Unlock
 * is a mock verify (password: "password"); "Not you?" drops the session.
 */

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LockPage() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock(event: FormEvent) {
    event.preventDefault();
    if (busy || password.length === 0) return;
    setBusy(true);
    setError(null);
    devDebug("[LockPage] unlock", { user: me.user.id });
    try {
      await api.auth.reauth(password);
      navigate("/", { replace: true });
    } catch (cause) {
      setError(
        t(
          cause instanceof ValidationError
            ? "auth.lock.invalid"
            : "common.request_failed",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <Avatar size="lg">
            <AvatarFallback>{initialsOf(me.user.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{me.user.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("auth.lock.subtitle")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={unlock} className="space-y-4" noValidate>
          <FormField
            name="lock-password"
            label={t("auth.lock.password")}
            required
            error={error ?? undefined}
          >
            <div className="relative">
              <Input
                id="lock-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
                required
                className="pe-9"
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
          <Button
            type="submit"
            className="w-full"
            disabled={busy || password.length === 0}
          >
            {busy ? <Spinner /> : <Lock className="size-4" />}
            {t("auth.lock.submit")}
          </Button>
          <p className="text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => void logout()}
            >
              {t("auth.lock.notYou")}
            </Button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
