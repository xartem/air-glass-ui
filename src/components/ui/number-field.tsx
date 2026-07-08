import { NumberField as NumberFieldPrimitive } from "@base-ui/react"
import { cva, type VariantProps } from "class-variance-authority"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Numeric input with increment/decrement steppers, wrapping the @base-ui/react
 * NumberField primitive (same idiom as combobox.tsx). Reuses Input's field
 * recipe (--field-bg, border-input, ring-ring) and height ladder (32/38/42px).
 * Token-only; the primitive owns clamping, keyboard, and wheel behavior.
 */

const numberFieldGroupVariants = cva(
  "flex w-full min-w-0 items-stretch overflow-hidden rounded-md border border-input bg-[var(--field-bg)] transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:bg-input/50 has-disabled:opacity-50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-disabled:bg-input/80 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
  {
    variants: {
      inputSize: {
        sm: "h-[32px] rounded-[var(--radius-sm)]",
        default: "h-[38px]",
        lg: "h-[42px]",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
)

const stepperButtonClass =
  "flex aspect-square h-full shrink-0 items-center justify-center text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-40 [&>svg]:size-4"

type NumberFieldProps = NumberFieldPrimitive.Root.Props &
  VariantProps<typeof numberFieldGroupVariants> & {
    className?: string
    inputClassName?: string
  }

function NumberField({
  className,
  inputClassName,
  inputSize = "default",
  ...props
}: NumberFieldProps) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      data-size={inputSize}
      className={cn("inline-flex w-full flex-col", className)}
      {...props}
    >
      <NumberFieldPrimitive.Group
        data-slot="number-field-group"
        className={numberFieldGroupVariants({ inputSize })}
      >
        <NumberFieldPrimitive.Decrement
          data-slot="number-field-decrement"
          className={cn(stepperButtonClass, "border-r border-input")}
        >
          <Minus aria-hidden="true" />
        </NumberFieldPrimitive.Decrement>
        <NumberFieldPrimitive.Input
          data-slot="number-field-input"
          className={cn(
            "w-full min-w-0 flex-1 bg-transparent text-center text-base outline-none tabular-nums md:text-[15px]",
            inputSize === "sm" && "text-sm",
            inputClassName
          )}
        />
        <NumberFieldPrimitive.Increment
          data-slot="number-field-increment"
          className={cn(stepperButtonClass, "border-l border-input")}
        >
          <Plus aria-hidden="true" />
        </NumberFieldPrimitive.Increment>
      </NumberFieldPrimitive.Group>
    </NumberFieldPrimitive.Root>
  )
}

export { NumberField, numberFieldGroupVariants }
