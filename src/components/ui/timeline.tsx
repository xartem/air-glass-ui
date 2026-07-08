import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Vertical timeline compound for activity feeds / order history / audit trails.
 * Token-only: indicator variants map to the shared --status-* tokens, the
 * connector uses the border token. Compose freely; every part carries data-slot.
 */

function Timeline({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="timeline"
      className={cn("relative flex flex-col", className)}
      {...props}
    />
  )
}

function TimelineItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="timeline-item"
      className={cn(
        "relative flex gap-3 pb-6 last:pb-0 [&:last-child_[data-slot=timeline-connector]]:hidden",
        className
      )}
      {...props}
    />
  )
}

const timelineIndicatorVariants = cva(
  "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border bg-card text-foreground [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-border text-muted-foreground",
        success:
          "border-transparent bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
        warning:
          "border-transparent bg-[var(--status-pending-bg)] text-[var(--status-pending-fg)]",
        info: "border-transparent bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
        destructive:
          "border-transparent bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TimelineIndicator({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof timelineIndicatorVariants>) {
  return (
    <span
      data-slot="timeline-indicator"
      data-variant={variant}
      className={cn(timelineIndicatorVariants({ variant }), className)}
      {...props}
    />
  )
}

function TimelineConnector({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="timeline-connector"
      aria-hidden="true"
      className={cn(
        "absolute top-8 bottom-0 left-3.5 -z-0 w-px -translate-x-1/2 bg-border",
        className
      )}
      {...props}
    />
  )
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-content"
      className={cn("flex flex-col gap-0.5 pt-0.5", className)}
      {...props}
    />
  )
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

function TimelineDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="timeline-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function TimelineTime({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="timeline-time"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineConnector,
  TimelineContent,
  TimelineTitle,
  TimelineDescription,
  TimelineTime,
  timelineIndicatorVariants,
}
