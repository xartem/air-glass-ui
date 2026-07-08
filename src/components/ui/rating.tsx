import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Star rating for product reviews / feedback. Interactive (buttons, keyboard,
 * hover preview) or read-only display. Token-only: the amber fill comes from the
 * --status-pending-fg token, never text-yellow-*.
 */

const ratingVariants = cva("inline-flex items-center", {
  variants: {
    size: {
      sm: "gap-0.5 [&_svg]:size-3.5",
      default: "gap-1 [&_svg]:size-4.5",
      lg: "gap-1 [&_svg]:size-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

const starClass = (filled: boolean) =>
  cn(
    "transition-colors",
    filled
      ? "fill-current text-[var(--status-pending-fg)]"
      : "text-muted-foreground/40"
  )

type RatingProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> &
  VariantProps<typeof ratingVariants> & {
    value: number
    onValueChange?: (value: number) => void
    max?: number
    readOnly?: boolean
    disabled?: boolean
    label?: string
  }

function Rating({
  className,
  value,
  onValueChange,
  max = 5,
  size = "default",
  readOnly = false,
  disabled = false,
  label = "Rating",
  ...props
}: RatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)
  const interactive = !readOnly && !disabled
  const displayValue = hovered ?? value
  const stars = Array.from({ length: max }, (_, i) => i + 1)

  if (!interactive) {
    return (
      <div
        data-slot="rating"
        data-size={size}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
        role="img"
        aria-label={`${value} ${label} of ${max}`}
        className={cn(
          ratingVariants({ size }),
          disabled && "opacity-50",
          className
        )}
        {...props}
      >
        {stars.map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            className={starClass(star <= value)}
          />
        ))}
      </div>
    )
  }

  function setValue(next: number) {
    onValueChange?.(next)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      setValue(Math.min(max, value + 1))
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      setValue(Math.max(0, value - 1))
    } else if (event.key === "Home") {
      event.preventDefault()
      setValue(0)
    } else if (event.key === "End") {
      event.preventDefault()
      setValue(max)
    }
  }

  return (
    <div
      data-slot="rating"
      data-size={size}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} of ${max}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setHovered(null)}
      className={cn(
        ratingVariants({ size }),
        "rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          tabIndex={-1}
          aria-label={`${star} ${label} of ${max}`}
          onClick={() => setValue(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="cursor-pointer rounded-sm outline-none transition-transform hover:scale-110"
        >
          <Star aria-hidden="true" className={starClass(star <= displayValue)} />
        </button>
      ))}
    </div>
  )
}

export { Rating, ratingVariants }
