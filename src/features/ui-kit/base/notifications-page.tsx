import { ComponentDemo, ShowcasePage } from "@/components/component-demo";
import { toast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

/*
 * Notifications showcase (W5): buttons that fire sonner toasts in each variant,
 * plus description and action examples. Firing a toast is the demo's whole
 * point — no other data flow, no logging.
 */
export function NotificationsPage() {
  useLocale();

  return (
    <ShowcasePage
      title={t("showcase.base.notifications.title")}
      description={t("showcase.base.notifications.desc")}
      breadcrumb={{ group: t("nav.components.base") }}
    >
      <ComponentDemo
        title={t("showcase.s.variants")}
        notes={t("showcase.base.notifications.note")}
        code={`toast.success("Your changes were saved");
toast.error("Something went wrong");
toast.info("A new update is available");
toast.warning("Your session is about to expire");`}
      >
        <Button
          variant="success"
          onClick={() => toast.success(t("showcase.base.notifications.saved"))}
        >
          {t("showcase.base.notifications.success")}
        </Button>
        <Button
          variant="destructive"
          onClick={() => toast.error(t("showcase.base.notifications.failed"))}
        >
          {t("showcase.base.notifications.error")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast.info(t("showcase.base.notifications.update"))}
        >
          {t("showcase.base.notifications.info")}
        </Button>
        <Button
          variant="warning"
          onClick={() => toast.warning(t("showcase.base.notifications.expire"))}
        >
          {t("showcase.base.notifications.warning")}
        </Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.notifications.description")}
        code={`toast.success("Your changes were saved", {
  description: "All fields were updated successfully.",
});`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast.success(t("showcase.base.notifications.saved"), {
              description: t("showcase.base.notifications.savedDesc"),
            })
          }
        >
          {t("showcase.base.notifications.description")}
        </Button>
      </ComponentDemo>

      <ComponentDemo
        title={t("showcase.base.notifications.action")}
        code={`toast("Item deleted", {
  action: {
    label: "Undo",
    onClick: () => toast.success("Item restored"),
  },
});`}
      >
        <Button
          variant="outline"
          onClick={() =>
            toast(t("showcase.base.notifications.deleted"), {
              action: {
                label: t("showcase.base.notifications.undo"),
                onClick: () =>
                  toast.success(t("showcase.base.notifications.restored")),
              },
            })
          }
        >
          {t("showcase.base.notifications.action")}
        </Button>
      </ComponentDemo>
    </ShowcasePage>
  );
}
