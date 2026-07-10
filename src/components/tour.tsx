import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { devDebug } from "@/lib/debug";
import { t } from "@/lib/i18n";

/*
 * Tour (W5 gap primitive): a light popover-driven coach-mark walkthrough. Each
 * step points at a DOM element (CSS selector); a dimmed spotlight backdrop rings
 * the target and a Popover card carries the copy + next/prev/skip. Built on the
 * existing Popover primitive (focus is moved into the card, Escape skips).
 * Interactive, so it logs on step advance (devDebug, dev-only).
 */

export interface TourStep {
  /** CSS selector for the element this step highlights. */
  target: string;
  title: string;
  content: string;
}

export function Tour({
  steps,
  open,
  onOpenChange,
  onFinish,
}: {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFinish?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const step = steps[index];
    if (!step) return;
    const element = document.querySelector(step.target);
    if (!element) {
      setRect(null);
      return;
    }
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    const measure = () => setRect(element.getBoundingClientRect());
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, index, steps]);

  if (!open) return null;
  const step = steps[index];
  if (!step) return null;
  const isLast = index === steps.length - 1;

  const finish = () => {
    devDebug("[tour] step", "finish");
    onOpenChange(false);
    onFinish?.();
  };
  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    devDebug("[tour] step", index + 1);
    setIndex((value) => value + 1);
  };
  const prev = () => setIndex((value) => Math.max(0, value - 1));
  const skip = () => onOpenChange(false);

  return createPortal(
    <div
      className="fixed inset-0 z-60"
      role="dialog"
      aria-modal="true"
      aria-label={t("showcase.tour.title")}
    >
      <button
        type="button"
        aria-label={t("showcase.tour.skip")}
        className="absolute inset-0 cursor-default bg-foreground/40"
        onClick={skip}
      />
      {rect ? (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      ) : null}
      <Popover open>
        <PopoverAnchor asChild>
          <div
            className="pointer-events-none absolute"
            style={{
              top: rect?.top ?? "50%",
              left: rect?.left ?? "50%",
              width: rect?.width ?? 0,
              height: rect?.height ?? 0,
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={12}
          onEscapeKeyDown={skip}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="w-72 space-y-3"
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold tracking-tight">{step.title}</p>
            <p className="text-sm text-muted-foreground">{step.content}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {t("showcase.tour.step", {
                current: String(index + 1),
                total: String(steps.length),
              })}
            </span>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={skip}>
                {t("showcase.tour.skip")}
              </Button>
              {index > 0 ? (
                <Button variant="outline" size="sm" onClick={prev}>
                  {t("showcase.tour.prev")}
                </Button>
              ) : null}
              <Button size="sm" onClick={next}>
                {isLast ? t("showcase.tour.finish") : t("showcase.tour.next")}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>,
    document.body,
  );
}
