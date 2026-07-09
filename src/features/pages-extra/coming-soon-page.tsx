import { useState, type FormEvent } from "react";
import { devDebug } from "@/lib/debug";
import { Bird, Code2, Contact, Rocket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Countdown } from "@/features/pages-extra/countdown";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * /coming-soon (public): pre-launch hero with a countdown, an email subscribe
 * field (mock no-op → toast) and social links.
 */

const SOCIALS = [
  { key: "twitter", icon: Bird },
  { key: "github", icon: Code2 },
  { key: "linkedin", icon: Contact },
] as const;

export function ComingSoonPage() {
  useLocale();
  const [email, setEmail] = useState("");
  const [target] = useState(() => Date.now() + 5 * 86400 * 1000);

  function subscribe(event: FormEvent) {
    event.preventDefault();
    if (!email) return;
    devDebug("[ComingSoonPage] subscribe", { email });
    setEmail("");
    toast.success(t("comingSoon.subscribed"));
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Rocket className="size-8" />
      </span>
      <div className="space-y-2">
        <h1 className="bg-[image:var(--gradient-heading)] bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          {t("comingSoon.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("comingSoon.subtitle")}
        </p>
      </div>
      <Countdown target={target} />
      <form onSubmit={subscribe} className="flex w-full max-w-sm gap-2">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("comingSoon.emailPlaceholder")}
          aria-label={t("comingSoon.emailPlaceholder")}
          required
        />
        <Button type="submit" disabled={!email}>
          {t("comingSoon.subscribe")}
        </Button>
      </form>
      <div className="flex items-center gap-2">
        {SOCIALS.map(({ key, icon: Icon }) => (
          <Button key={key} variant="outline" size="icon-sm" aria-label={key}>
            <Icon className="size-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}
