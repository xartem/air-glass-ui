import { useId, type ReactNode } from 'react'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

/*
 * SwitchRow (E6): a labelled toggle block — title + hint on the left, glassy Switch
 * on the right. Each row is its own glass card with a hover-lift (styling in index.css
 * on [data-slot="switch-row"]). The whole row is a <label htmlFor> so a tap anywhere
 * (incl. the hint) toggles, and it's keyboard-reachable. Stack several with a gap
 * (e.g. `space-y-2`) inside a Panel for a settings-style list.
 */
export function SwitchRow({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}) {
  const autoId = useId()
  const switchId = id ?? autoId
  return (
    <label
      htmlFor={switchId}
      data-slot="switch-row"
      data-disabled={disabled || undefined}
      className={cn('flex items-center justify-between gap-4', disabled && 'opacity-60', className)}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch id={switchId} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </label>
  )
}
