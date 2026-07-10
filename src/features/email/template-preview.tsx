import { useState } from "react";
import { Code, Copy, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Shared email-template preview: a rendered (token-styled email HTML) frame with
 * a device-width toggle, a read-only "view source" panel and a copy-HTML action.
 * The email HTML uses inline styles by design — that is how email clients render.
 */

export function TemplatePreview({ html }: { html: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showSource, setShowSource] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(html);
    toast.success(t("email.templates.copied"));
  };

  return (
    <Panel
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-0.5">
            <Button
              variant={device === "desktop" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={t("email.templates.desktop")}
              onClick={() => setDevice("desktop")}
            >
              <Monitor />
            </Button>
            <Button
              variant={device === "mobile" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label={t("email.templates.mobile")}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone />
            </Button>
          </div>
          <Button
            variant={showSource ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowSource((current) => !current)}
          >
            <Code /> {t("email.templates.view_source")}
          </Button>
          <Button variant="outline" size="sm" onClick={copy}>
            <Copy /> {t("email.templates.copy_html")}
          </Button>
        </div>
      }
      title={t("email.templates.preview")}
    >
      {showSource ? (
        <pre className="max-h-[32rem] overflow-auto rounded-xl bg-muted p-4 text-xs">
          <code>{html}</code>
        </pre>
      ) : (
        <div className="flex justify-center rounded-xl bg-muted/40 p-4">
          <div
            className={cn(
              "w-full rounded-lg bg-white shadow-sm transition-all",
              device === "mobile" ? "max-w-sm" : "max-w-2xl",
            )}
            // eslint-disable-next-line react/no-danger -- static, author-controlled demo email HTML
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </Panel>
  );
}
