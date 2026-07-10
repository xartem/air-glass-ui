import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";

import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Sweet Alerts showcase (W5): the SweetAlert-style confirm/success/error modals
 * this template ships via the shared AlertDialog + ConfirmDialog primitives.
 * Each trigger opens a dialog; confirming fires a toast. Static demos.
 */
export function SweetAlertsPage() {
  useLocale();
  return (
    <ShowcasePage
      title={t("showcase.advance.sweetAlerts.title")}
      description={t("showcase.advance.sweetAlerts.desc")}
      breadcrumb={{ group: t("nav.components.advance") }}
    >
      <ComponentDemo
        title={t("showcase.advance.sweetAlerts.confirmSection")}
        code={`<ConfirmDialog
  trigger={<Button variant="outline">Publish article</Button>}
  title="Publish this article?"
  description="It will be visible to everyone immediately."
  confirmLabel="Publish"
  onConfirm={() => toast.success("Article published")}
/>`}
      >
        <ConfirmDialog
          trigger={
            <Button variant="outline">
              {t("showcase.advance.sweetAlerts.confirmTrigger")}
            </Button>
          }
          title={t("showcase.advance.sweetAlerts.confirmTitle")}
          description={t("showcase.advance.sweetAlerts.confirmText")}
          confirmLabel={t("showcase.advance.sweetAlerts.confirmTrigger")}
          onConfirm={() =>
            toast.success(t("showcase.advance.sweetAlerts.toastSaved"))
          }
        />
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.sweetAlerts.successSection")}
        code={`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="success">Show success</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia><CircleCheck /></AlertDialogMedia>
      <AlertDialogTitle>Payment received</AlertDialogTitle>
      <AlertDialogDescription>
        Your subscription is now active.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction variant="success">Great</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="success">
              {t("showcase.advance.sweetAlerts.successTrigger")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="text-[var(--status-success-fg)]">
                <CircleCheck />
              </AlertDialogMedia>
              <AlertDialogTitle>
                {t("showcase.advance.sweetAlerts.successTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("showcase.advance.sweetAlerts.successText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction variant="success">
                {t("showcase.advance.sweetAlerts.successAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.sweetAlerts.errorSection")}
        code={`<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="warning">Show warning</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogMedia><TriangleAlert /></AlertDialogMedia>
      <AlertDialogTitle>Storage almost full</AlertDialogTitle>
      <AlertDialogDescription>
        You have used 92% of your plan quota.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Dismiss</AlertDialogCancel>
      <AlertDialogAction>Upgrade plan</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="warning">
              {t("showcase.advance.sweetAlerts.warningTrigger")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia className="text-[var(--status-pending-fg)]">
                <TriangleAlert />
              </AlertDialogMedia>
              <AlertDialogTitle>
                {t("showcase.advance.sweetAlerts.warningTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("showcase.advance.sweetAlerts.warningText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("showcase.advance.sweetAlerts.dismiss")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  toast.success(t("showcase.advance.sweetAlerts.toastSaved"))
                }
              >
                {t("showcase.advance.sweetAlerts.warningAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.advance.sweetAlerts.deleteSection")}
        notes={t("showcase.advance.sweetAlerts.note")}
        code={`<ConfirmDialog
  trigger={<Button variant="destructive-filled">Delete account</Button>}
  title="Delete this account?"
  description="This action is permanent and cannot be undone."
  confirmLabel="Delete"
  destructive
  onConfirm={() => toast.error("Account deleted")}
/>`}
      >
        <ConfirmDialog
          trigger={
            <Button variant="destructive-filled">
              <CircleAlert />
              {t("showcase.advance.sweetAlerts.deleteTrigger")}
            </Button>
          }
          title={t("showcase.advance.sweetAlerts.deleteTitle")}
          description={t("showcase.advance.sweetAlerts.deleteText")}
          confirmLabel={t("common.delete")}
          destructive
          onConfirm={() =>
            toast.error(t("showcase.advance.sweetAlerts.toastDeleted"))
          }
        />
      </ComponentDemo>
    </ShowcasePage>
  );
}
