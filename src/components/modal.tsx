import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/*
 * Modal (E6 §1E): the single dialog shell — title, body, actions bottom-right
 * (primary rightmost, "Cancel" to its left). Screens never style their own dialogs.
 */

export function Modal({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "default",
}: {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  /** Action buttons; render primary action LAST so it sits bottom-right (E6 §1E). */
  footer?: ReactNode;
  size?: "default" | "lg";
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn(size === "lg" && "sm:max-w-3xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
