import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Markdown body for Help articles (D:help, C11 §6) — the ONLY react-markdown
 * consumer in the SPA (E2 §2): trusted, shipped-with-code docs, never user input.
 * Blockquotes render as info callouts (the C11 "typical question" pattern).
 */

export function HelpArticleBody({
  markdown,
  isFallback,
  className,
}: {
  markdown: string;
  isFallback?: boolean;
  className?: string;
}) {
  // Screenshot lightbox (UI:help §2): click opens the image in a footer-less Dialog.
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );
  return (
    <div
      className={cn(
        "min-w-0 text-[15px] leading-relaxed text-secondary-foreground",
        className,
      )}
    >
      {isFallback ? (
        <p className="mb-4 text-[13px] text-muted-foreground italic">
          {t("help.fallbackNote")}
        </p>
      ) : null}
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className="mt-6 mb-2 text-lg font-semibold tracking-tight text-foreground">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mt-6 mb-2 text-lg font-semibold tracking-tight text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-5 mb-1.5 text-[15px] font-semibold text-foreground">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-3">{children}</p>,
          ol: ({ children }) => (
            <ol className="my-3 flex list-decimal flex-col gap-2 ps-6 marker:font-semibold marker:text-primary">
              {children}
            </ol>
          ),
          ul: ({ children }) => (
            <ul className="my-3 flex list-disc flex-col gap-2 ps-6 marker:text-primary">
              {children}
            </ul>
          ),
          li: ({ children }) => <li className="ps-1">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          code: ({ children }) => (
            <code className="rounded-[5px] bg-secondary px-1.5 py-0.5 font-mono text-[0.9em]">
              {children}
            </code>
          ),
          a: ({ href, children }) => (
            <a href={href} className="font-medium text-primary hover:underline">
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt ?? ""}
              className="my-4 max-w-full cursor-pointer rounded-xl border border-border shadow-sm"
              onClick={() =>
                src && setLightbox({ src: String(src), alt: alt ?? "" })
              }
            />
          ),
          blockquote: ({ children }) => (
            <Alert className="my-4 border-none bg-[var(--status-info-bg)] text-[var(--status-info-fg)]">
              <Info className="size-4" />
              <AlertDescription className="text-[14px] text-inherit [&_p]:my-0 [&_strong]:text-inherit">
                {children}
              </AlertDescription>
            </Alert>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
      <Dialog
        open={lightbox !== null}
        onOpenChange={(open) => !open && setLightbox(null)}
      >
        <DialogContent className="max-w-4xl p-2 sm:p-3">
          <DialogTitle className="sr-only">
            {lightbox?.alt || t("help.screenshot")}
          </DialogTitle>
          {lightbox ? (
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
