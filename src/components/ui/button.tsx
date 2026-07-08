import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/*
 * Sizing and tiers follow E1 §2: controls 38px (compact 32px), radius 10px,
 * 15px medium text; primary/destructive-filled gradients and shadows live in the
 * theme (index.css) keyed by data-variant. Fills may be keyed off data-variant,
 * but every color value here must be a design token — never a raw rgba()/#hex literal.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary font-semibold text-primary-foreground",
        outline:
          "border-input text-secondary-foreground hover:bg-[var(--field-bg)] hover:text-foreground aria-expanded:bg-[var(--field-bg)] aria-expanded:text-foreground",
        secondary:
          "bg-primary/12 text-[var(--status-info-fg)] hover:bg-primary/20 aria-expanded:bg-primary/20 dark:bg-primary/18 dark:hover:bg-primary/20",
        ghost:
          "hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        destructive:
          "border-destructive/25 bg-[var(--field-bg)] text-[var(--status-error-fg)] hover:border-destructive/45 hover:bg-destructive/10 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        success:
          "border-[var(--status-success-fg)]/25 bg-[var(--field-bg)] text-[var(--status-success-fg)] hover:border-[var(--status-success-fg)]/45 hover:bg-[var(--status-success-bg)] aria-expanded:bg-[var(--status-success-bg)]",
        warning:
          "border-[var(--status-pending-fg)]/25 bg-[var(--field-bg)] text-[var(--status-pending-fg)] hover:border-[var(--status-pending-fg)]/45 hover:bg-[var(--status-pending-bg)] aria-expanded:bg-[var(--status-pending-bg)]",
        "destructive-filled":
          "bg-destructive font-semibold text-destructive-foreground focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-[38px] gap-2 px-4 text-[15px] tracking-[-0.006em] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4.5",
        xs: "h-7 gap-1 rounded-[var(--radius-sm)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-[32px] gap-1.5 rounded-md px-3 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
        lg: "h-[38px] gap-2 px-4 text-[15px] tracking-[-0.006em] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4.5",
        icon: "size-[38px]",
        "icon-xs":
          "size-7 rounded-[var(--radius-sm)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-[32px] rounded-md in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-[38px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
