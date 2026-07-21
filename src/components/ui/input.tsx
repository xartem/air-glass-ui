import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Size is an orthogonal axis; every state class (field fill, focus ring,
 * disabled/aria-invalid) lives in the shared base so all sizes behave the same.
 * The native <input size> DOM attribute is omitted — the CVA prop is `inputSize`.
 */
const inputVariants = cva(
  "w-full min-w-0 rounded-md border border-input bg-[var(--field-bg)] py-1 transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      inputSize: {
        sm: "h-[var(--control-h-sm)] rounded-[var(--radius-sm)] px-2.5 text-sm",
        default: "h-[var(--control-h)] px-3 text-base md:text-[15px]",
        lg: "h-[var(--control-h-lg)] px-3.5 text-base md:text-[15px]",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  },
);

function Input({
  className,
  type,
  inputSize = "default",
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={inputSize}
      className={cn(inputVariants({ inputSize }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };
