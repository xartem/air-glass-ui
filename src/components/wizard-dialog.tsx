import { useState, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * WizardDialog (E6 §1E): step-by-step creation in the single dialog shell.
 * Actions bottom-right: primary (Next/Finish) rightmost, "Cancel" to its left,
 * "Back" on the far left. Screens never build their own wizards.
 */

export type WizardStep = { key: string; label: string; content: ReactNode };

function StepIndicator({
  steps,
  current,
}: {
  steps: WizardStep[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-1.5">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step.key} className="flex min-w-0 items-center gap-1.5">
            {index > 0 ? (
              <span className="h-px w-5 shrink-0 bg-border" />
            ) : null}
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                active && "bg-primary text-primary-foreground",
                done && "bg-accent text-accent-foreground",
                !active && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function WizardDialog({
  trigger,
  title,
  steps,
  onFinish,
  finishLabel,
}: {
  trigger: ReactNode;
  title: string;
  steps: WizardStep[];
  onFinish: () => void;
  finishLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const isLast = index === steps.length - 1;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <StepIndicator steps={steps} current={index} />
          <p className="text-xs text-muted-foreground">
            {t("wizard.step", { current: index + 1, total: steps.length })}
          </p>
          <div>{steps[index]?.content}</div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
          >
            <ChevronLeft className="rtl:rotate-180" />
            {t("common.back")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (isLast) {
                  onFinish();
                  handleOpenChange(false);
                } else {
                  setIndex(index + 1);
                }
              }}
            >
              {isLast ? <Check /> : null}
              {isLast ? (finishLabel ?? t("wizard.finish")) : t("wizard.next")}
              {isLast ? null : <ChevronRight className="rtl:rotate-180" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
