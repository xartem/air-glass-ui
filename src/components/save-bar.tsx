import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * SaveBar (E4 §1): the standard save affordance for forms WITHOUT their own
 * PageHeader action (settings tabs, contacts, role matrix, menu builder).
 * Hidden while the form is clean; slides in on the first change. Full-screen
 * editors with an EditorLayout keep their own sticky bottom bar — never both.
 * Handles Ctrl/Cmd+S and warns on tab close while dirty.
 */

export function SaveBar({
  dirty,
  saving = false,
  onSave,
  onReset,
  className,
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onReset: () => void;
  className?: string;
}) {
  useEffect(() => {
    if (!dirty) return;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        onSave();
      }
    }
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [dirty, onSave]);

  if (!dirty) return null;

  return (
    <div
      data-slot="save-bar"
      role="status"
      className={cn(
        "glass-panel fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-4 rounded-2xl px-5 py-3 shadow-lg",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">
        {t("savebar.unsaved")}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onReset} disabled={saving}>
          {t("savebar.reset")}
        </Button>
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? <Spinner /> : null}
          {t("savebar.save")}
        </Button>
      </div>
    </div>
  );
}
