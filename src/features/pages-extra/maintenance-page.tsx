import { useState, type FormEvent } from "react";
import { devDebug } from "@/lib/debug";
import { Hammer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Countdown } from "@/features/pages-extra/countdown";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /maintenance (public): scheduled-downtime splash with a countdown and a
 * "notify me" email capture (mock no-op → toast).
 */

export function MaintenancePage() {
  useLocale();
  const [email, setEmail] = useState("");
  const [target] = useState(() => Date.now() + 3 * 3600 * 1000);

  function notify(event: FormEvent) {
    event.preventDefault();
    if (!email) return;
    devDebug("[MaintenancePage] notify", { email });
    setEmail("");
    toast.success(t("maintenance.notified"));
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Hammer className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("maintenance.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("maintenance.subtitle")}
        </p>
      </div>
      <Countdown target={target} />
      <form onSubmit={notify} className="flex w-full max-w-sm gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("maintenance.emailPlaceholder")}
          aria-label={t("maintenance.emailPlaceholder")}
          required
        />
        <Button type="submit" disabled={!email}>
          {t("maintenance.notify")}
        </Button>
      </form>
    </div>
  );
}
