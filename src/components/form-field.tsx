import { cloneElement, isValidElement, type ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/*
 * FormField (E6 §3.1): <FormField name label required? help? error?>{widget}</FormField>
 * The single field wrapper — identical label/help/error placement on every screen.
 * 422 errors land here per-field (E4/E2 §6), never as a toast.
 */

export function FormField({
  name,
  label,
  required = false,
  help,
  error,
  children,
  className,
}: {
  name: string
  label: string
  required?: boolean
  help?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  // Programmatically associate help/error text and invalid state with the control
  // (WCAG 1.3.1, 3.3.1, 4.1.2). Only one of help/error renders at a time, so the
  // description id resolves to whichever is present.
  const describedBy = error ? `${name}-error` : help ? `${name}-help` : undefined

  const control = isValidElement(children)
    ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        'aria-invalid': error ? true : (children.props as Record<string, unknown>)['aria-invalid'],
        'aria-describedby':
          [(children.props as Record<string, unknown>)['aria-describedby'], describedBy].filter(Boolean).join(' ') ||
          undefined,
      })
    : children

  return (
    <div data-slot="form-field" data-invalid={error ? 'true' : undefined} className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className="gap-0.5">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {control}
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : help ? (
        <p id={`${name}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  )
}
