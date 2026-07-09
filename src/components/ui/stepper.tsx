import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/*
 * Standalone step-progress indicator for multi-step forms / onboarding / checkout.
 * Distinct from wizard-dialog.tsx (a modal composition) — this is the reusable
 * step *indicator*. Controlled via `activeStep` (0-based); each item derives its
 * data-state (completed/active/pending) from context + its own index. Token-only.
 */

type StepperOrientation = "horizontal" | "vertical"
type StepState = "completed" | "active" | "pending"

type StepperContextValue = {
  activeStep: number
  orientation: StepperOrientation
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

function useStepperContext() {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("Stepper compound components must be used within <Stepper>")
  }
  return context
}

const StepperItemContext = React.createContext<{ index: number; state: StepState } | null>(
  null
)

function useStepperItemContext() {
  const context = React.useContext(StepperItemContext)
  if (!context) {
    throw new Error("Stepper item parts must be used within <StepperItem>")
  }
  return context
}

function Stepper({
  className,
  activeStep,
  orientation = "horizontal",
  children,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  activeStep: number
  orientation?: StepperOrientation
  children: React.ReactNode
}) {
  const value = React.useMemo(
    () => ({ activeStep, orientation }),
    [activeStep, orientation]
  )
  return (
    <StepperContext.Provider value={value}>
      <div
        data-slot="stepper"
        data-orientation={orientation}
        className={cn(
          "flex",
          orientation === "horizontal"
            ? "flex-row items-start"
            : "flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  )
}

function StepperItem({
  className,
  index,
  children,
  ...props
}: React.ComponentProps<"div"> & { index: number }) {
  const { activeStep, orientation } = useStepperContext()
  const state: StepState =
    index < activeStep ? "completed" : index === activeStep ? "active" : "pending"

  const itemValue = React.useMemo(() => ({ index, state }), [index, state])

  return (
    <StepperItemContext.Provider value={itemValue}>
      <div
        data-slot="stepper-item"
        data-state={state}
        data-orientation={orientation}
        aria-current={state === "active" ? "step" : undefined}
        className={cn(
          "group/stepper-item flex flex-1 last:flex-none",
          orientation === "horizontal"
            ? "flex-row items-center gap-2"
            : "flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  )
}

function StepperIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { state } = useStepperItemContext()
  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors [&>svg]:size-4",
        "data-[state=pending]:border-border data-[state=pending]:text-muted-foreground",
        "data-[state=active]:border-[var(--status-info-fg)] data-[state=active]:text-[var(--status-info-fg)]",
        "data-[state=completed]:border-transparent data-[state=completed]:bg-[var(--status-success-bg)] data-[state=completed]:text-[var(--status-success-fg)]",
        className
      )}
      {...props}
    >
      {state === "completed" ? <Check aria-hidden="true" /> : children}
    </div>
  )
}

function StepperSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { state } = useStepperItemContext()
  const { orientation } = useStepperContext()
  return (
    <div
      data-slot="stepper-separator"
      data-state={state}
      aria-hidden="true"
      className={cn(
        "shrink-0 bg-border transition-colors group-last/stepper-item:hidden data-[state=completed]:bg-[var(--status-success-fg)]",
        orientation === "horizontal"
          ? "h-px flex-1"
          : "ms-4 min-h-6 w-px flex-1",
        className
      )}
      {...props}
    />
  )
}

function StepperContent({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useStepperContext()
  return (
    <div
      data-slot="stepper-content"
      className={cn(
        "flex flex-col gap-0.5",
        orientation === "vertical" && "pt-1 pb-2 ps-2",
        className
      )}
      {...props}
    />
  )
}

function StepperTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="stepper-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

function StepperDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="stepper-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Stepper,
  StepperItem,
  StepperIndicator,
  StepperSeparator,
  StepperContent,
  StepperTitle,
  StepperDescription,
}
