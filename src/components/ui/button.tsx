import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/*
 * Sizing and tiers follow E1 §2: controls 38px (compact 32px), radius 10px,
 * 15px medium text; primary/destructive-filled gradients and shadows live in the
 * theme (index.css) keyed by data-variant — utilities here must not set them.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary font-semibold text-primary-foreground",
        outline:
          "border-input text-secondary-foreground hover:bg-white/70 hover:text-foreground aria-expanded:bg-white/70 aria-expanded:text-foreground dark:hover:bg-white/10 dark:aria-expanded:bg-white/10",
        secondary:
          "bg-[rgba(29,141,242,0.12)] text-[#0d6fc5] hover:bg-[rgba(29,141,242,0.2)] aria-expanded:bg-[rgba(29,141,242,0.2)] dark:bg-[rgba(29,141,242,0.18)] dark:text-[#7cc3fa] dark:hover:bg-[rgba(29,141,242,0.26)]",
        ghost:
          "hover:bg-[rgba(148,163,184,0.16)] hover:text-foreground aria-expanded:bg-[rgba(148,163,184,0.16)] aria-expanded:text-foreground dark:hover:bg-[rgba(148,163,184,0.14)]",
        destructive:
          "border-[rgba(220,38,38,0.26)] bg-white/70 text-[#b91c1c] hover:border-[rgba(220,38,38,0.45)] hover:bg-[rgba(254,226,226,0.9)] hover:text-[#991b1b] focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:border-[rgba(239,68,68,0.28)] dark:bg-[rgba(148,163,184,0.09)] dark:text-red-400 dark:hover:bg-[rgba(239,68,68,0.16)] dark:hover:text-red-300 dark:focus-visible:ring-destructive/40",
        "destructive-filled":
          "bg-destructive font-semibold text-white focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40",
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
