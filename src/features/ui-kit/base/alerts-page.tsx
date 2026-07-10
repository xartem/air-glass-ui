import { useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Alerts showcase (W5): the Alert primitive across its variants, icon layouts,
 * a fully composed title + description + action, status-token skins, and a
 * dismissible pattern. Static demos — no data flow.
 */

/** Local dismissible sample; toggling is pure UI state, not data flow. */
function DismissibleAlert() {
  const [open, setOpen] = useState(true);
  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("showcase.base.alerts.dismissible")}
      </Button>
    );
  }
  return (
    <Alert>
      <Info />
      <AlertTitle>New workspace features</AlertTitle>
      <AlertDescription>
        Boards now support inline comments and mentions.
      </AlertDescription>
      <AlertAction>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function AlertsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.base.alerts.title")}
      description={t("showcase.base.alerts.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        previewClassName="flex-col items-stretch"
        code={`<Alert>
  <AlertTitle>Heads up</AlertTitle>
  <AlertDescription>This is a default alert.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <AlertTitle>Something went wrong</AlertTitle>
  <AlertDescription>Your changes could not be saved.</AlertDescription>
</Alert>`}
      >
        <Alert>
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>This is a default alert.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>Your changes could not be saved.</AlertDescription>
        </Alert>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.s.withIcon")}
        previewClassName="flex-col items-stretch"
        code={`<Alert>
  <Info />
  <AlertTitle>Update available</AlertTitle>
  <AlertDescription>A new version is ready to install.</AlertDescription>
</Alert>
<Alert variant="destructive">
  <CircleAlert />
  <AlertTitle>Payment failed</AlertTitle>
  <AlertDescription>Update your billing details to continue.</AlertDescription>
</Alert>`}
      >
        <Alert>
          <Info />
          <AlertTitle>Update available</AlertTitle>
          <AlertDescription>
            A new version is ready to install.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>Payment failed</AlertTitle>
          <AlertDescription>
            Update your billing details to continue.
          </AlertDescription>
        </Alert>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.alerts.composed")}
        previewClassName="flex-col items-stretch"
        code={`<Alert>
  <Info />
  <AlertTitle>Storage almost full</AlertTitle>
  <AlertDescription>
    You have used 92% of your plan quota.
  </AlertDescription>
  <AlertAction>
    <Button variant="outline" size="sm">Upgrade</Button>
  </AlertAction>
</Alert>`}
      >
        <Alert>
          <Info />
          <AlertTitle>Storage almost full</AlertTitle>
          <AlertDescription>
            You have used 92% of your plan quota.
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm">
              Upgrade
            </Button>
          </AlertAction>
        </Alert>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.alerts.status")}
        notes={t("showcase.base.alerts.status_note")}
        previewClassName="flex-col items-stretch"
        code={`<Alert className="border-[var(--status-success-fg)]/30 text-[var(--status-success-fg)]">
  <CircleCheck />
  <AlertTitle>Saved</AlertTitle>
</Alert>
<Alert className="border-[var(--status-pending-fg)]/30 text-[var(--status-pending-fg)]">
  <TriangleAlert />
  <AlertTitle>Review required</AlertTitle>
</Alert>
<Alert className="border-[var(--status-info-fg)]/30 text-[var(--status-info-fg)]">
  <Info />
  <AlertTitle>Scheduled maintenance</AlertTitle>
</Alert>`}
      >
        <Alert className="border-[var(--status-success-fg)]/30 text-[var(--status-success-fg)]">
          <CircleCheck />
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>All changes are up to date.</AlertDescription>
        </Alert>
        <Alert className="border-[var(--status-pending-fg)]/30 text-[var(--status-pending-fg)]">
          <TriangleAlert />
          <AlertTitle>Review required</AlertTitle>
          <AlertDescription>Two items are awaiting approval.</AlertDescription>
        </Alert>
        <Alert className="border-[var(--status-info-fg)]/30 text-[var(--status-info-fg)]">
          <Info />
          <AlertTitle>Scheduled maintenance</AlertTitle>
          <AlertDescription>Downtime is planned for Sunday.</AlertDescription>
        </Alert>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.alerts.dismissible")}
        notes={t("showcase.base.alerts.dismissible_note")}
        previewClassName="flex-col items-stretch"
        code={`<Alert>
  <Info />
  <AlertTitle>New workspace features</AlertTitle>
  <AlertDescription>Boards now support inline comments.</AlertDescription>
  <AlertAction>
    <Button variant="ghost" size="icon-sm" aria-label="Dismiss">
      <X />
    </Button>
  </AlertAction>
</Alert>`}
      >
        <DismissibleAlert />
      </ComponentDemo>
    </ShowcasePage>
  );
}
