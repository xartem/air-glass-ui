import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
 * Mirrors Input's size axis, but scales min-height/padding instead of a fixed
 * height (field-sizing-content grows the box). State classes stay in the base.
 */
const textareaVariants = cva(
  "flex field-sizing-content w-full rounded-md border border-input bg-[var(--field-bg)] text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-[15px] dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      inputSize: {
        sm: "min-h-14 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm",
        default: "min-h-16 px-3 py-2",
        lg: "min-h-20 px-3.5 py-2.5",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
)

function Textarea({
  className,
  inputSize = "default",
  ...props
}: Omit<React.ComponentProps<"textarea">, "size"> &
  VariantProps<typeof textareaVariants>) {
  return (
    <textarea
      data-slot="textarea"
      data-size={inputSize}
      className={cn(textareaVariants({ inputSize }), className)}
      {...props}
    />
  )
}

export { Textarea, textareaVariants }
