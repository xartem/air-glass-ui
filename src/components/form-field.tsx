import type { ReactNode } from 'react'

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
  return (
    <div data-slot="form-field" data-invalid={error ? 'true' : undefined} className={cn('space-y-1.5', className)}>
      <Label htmlFor={name} className="gap-0.5">
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
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
