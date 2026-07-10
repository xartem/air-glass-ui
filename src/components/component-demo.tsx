import {
  lazy,
  Suspense,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Check, ChevronsUpDown, Copy } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/toast";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * ComponentDemo (W5): the atom every component-showcase page is built from —
 * reused ~83×. A titled glass section with a live preview, an optional "Show
 * code" toggle revealing a read-only CodeMirror sample, and an optional
 * prop/variant notes block.
 *
 * Chrome (title, description, notes, button labels) is i18n'd via t(); the
 * `code` sample is LITERAL by design (source snippets are never translated).
 * Static UI — no data flow, so no logging.
 */

// Lazy so CodeMirror only loads when a viewer's "Show code" is actually opened.
const CodeEditor = lazy(() =>
  import("@/components/code-editor").then((m) => ({ default: m.CodeEditor })),
);

export function ComponentDemo({
  title,
  description,
  children,
  code,
  notes,
  className,
  previewClassName,
}: {
  title: string;
  description?: string;
  /** The live preview. */
  children: ReactNode;
  /** Literal source snippet (not translated). Omit to hide the code toggle. */
  code?: string;
  /** Optional prop/variant/a11y notes rendered under the preview. */
  notes?: ReactNode;
  className?: string;
  previewClassName?: string;
}) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("showcase.demo.copyFailed"));
    }
  };

  return (
    <section
      data-slot="component-demo"
      className={cn("glass-card overflow-hidden rounded-2xl", className)}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {code ? (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-expanded={showCode}
            onClick={() => setShowCode((value) => !value)}
          >
            <ChevronsUpDown />
            {showCode
              ? t("showcase.demo.hideCode")
              : t("showcase.demo.showCode")}
          </Button>
        ) : null}
      </header>

      <div
        className={cn(
          "flex flex-wrap items-center gap-4 p-5",
          previewClassName,
        )}
      >
        {children}
      </div>

      {notes ? (
        <div className="border-t border-[var(--glass-border)] px-5 py-3 text-xs text-muted-foreground">
          {notes}
        </div>
      ) : null}

      {code && showCode ? (
        <div className="relative border-t border-[var(--glass-border)]">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2.5 right-2.5 z-10"
            onClick={copy}
          >
            {copied ? <Check /> : <Copy />}
            {copied ? t("showcase.demo.copied") : t("showcase.demo.copy")}
          </Button>
          <Suspense
            fallback={
              <div className="flex h-24 items-center justify-center">
                <Spinner className="size-5" />
              </div>
            }
          >
            <CodeEditor
              value={code}
              onChange={() => {}}
              readOnly
              ariaLabel={t("showcase.demo.codeLabel")}
              className="rounded-none border-0"
            />
          </Suspense>
        </div>
      ) : null}
    </section>
  );
}

/*
 * ShowcasePage — the shared page shell for every showcase screen: PageHeader
 * with a group ▸ page breadcrumb + a lead paragraph, then the demo sections.
 * Keeps all ~83 pages structurally identical.
 */
export function ShowcasePage({
  title,
  description,
  icon,
  breadcrumb,
  children,
}: {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  /** Group label shown before the page title in the breadcrumb. */
  breadcrumb?: { group: string; groupHref?: string };
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-16">
      <PageHeader
        title={title}
        icon={icon}
        breadcrumbs={
          breadcrumb
            ? [
                { label: t("nav.group.components"), href: "/ui-kit" },
                { label: breadcrumb.group, href: breadcrumb.groupHref },
                { label: title },
              ]
            : undefined
        }
      />
      {description ? (
        <p className="-mt-2 max-w-2xl text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
