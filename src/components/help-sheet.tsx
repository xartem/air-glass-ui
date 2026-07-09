import { lazy, Suspense, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleHelp } from "lucide-react";
import { Link } from "react-router";

import { api } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/lib/i18n";

/*
 * Contextual help "?" (C11 §6, D:help §6): lives in PageHeader via the helpKey
 * prop. The button renders only when the screen has a matching doc page —
 * no article, no button. Opens a right Sheet; the user never leaves the screen.
 */

// [FIX] help-sheet lives in PageHeader (the shell) — a static import dragged
// react-markdown into the main chunk. Load the markdown body on demand.
const HelpArticleBody = lazy(() =>
  import("@/components/help-article").then((m) => ({
    default: m.HelpArticleBody,
  })),
);

export function HelpSheetButton({ screenKey }: { screenKey: string }) {
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: ["help-screen", screenKey],
    queryFn: () => api.help.forScreen(screenKey),
    staleTime: Infinity,
  });

  const article = query.data;
  if (!article) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("help.contextOpen")}
            onClick={() => setOpen(true)}
          >
            <CircleHelp />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("help.contextOpen")}</TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-[480px]"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetDescription className="text-[11px] font-semibold tracking-[0.07em] uppercase">
              {t("help.contextEyebrow")}
            </SheetDescription>
            <SheetTitle className="text-lg tracking-tight">
              {article.title}
            </SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            <Suspense
              fallback={
                <div className="flex justify-center py-8">
                  <Spinner className="size-5" />
                </div>
              }
            >
              <HelpArticleBody
                markdown={article.markdown}
                isFallback={article.is_fallback}
              />
            </Suspense>
          </div>
          <div className="flex justify-end border-t border-border px-4 py-3">
            <Button variant="link" asChild onClick={() => setOpen(false)}>
              <Link to={`/help/${article.module}/${article.page}`}>
                {t("help.openFull")} →
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
