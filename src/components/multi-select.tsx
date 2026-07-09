import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * MultiSelect (E2 §7: field type `multiselect` → this widget → keys from options).
 * Value is an array of option keys; selected options render as badges in the trigger.
 */

export type MultiSelectOption = { value: string; label: string }

export function MultiSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  id?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)

  const toggle = (key: string) => {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key])
  }

  const selectedOptions = options.filter((option) => value.includes(option.value))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Field container is a plain div, so the per-chip remove controls and the
          open trigger are real, keyboard-reachable sibling <button>s rather than
          interactive elements nested inside a button (WCAG 2.1.1, 4.1.2). The
          container is the popover anchor so the dropdown matches the field width. */}
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex min-h-[42px] w-full items-center gap-2 rounded-lg border border-input bg-transparent ps-3 pe-1 text-sm',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1 py-1.5 text-start">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder ?? t('multiselect.placeholder')}</span>
            ) : (
              selectedOptions.map((option) => (
                <Badge key={option.value} variant="secondary" className="gap-1 pe-1">
                  {option.label}
                  <button
                    type="button"
                    aria-label={t('multiselect.remove', { label: option.label })}
                    className="-me-0.5 inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => toggle(option.value)}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </span>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="ghost"
              size="icon-sm"
              role="combobox"
              aria-expanded={open}
              aria-label={placeholder ?? t('multiselect.placeholder')}
              className="shrink-0 text-muted-foreground"
            >
              <ChevronsUpDown className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={t('common.search')} />
          <CommandList>
            <CommandEmpty>{t('reference.empty')}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={option.label} onSelect={() => toggle(option.value)}>
                  <Check
                    className={cn('size-4', value.includes(option.value) ? 'opacity-100' : 'opacity-0')}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
