import { useEffect, useState } from 'react'
import { ChevronsUpDown, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Spinner } from '@/components/ui/spinner'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/*
 * ReferencePicker (E6 §3, E2 §7: field type `reference` → record id).
 * Link-by-reference, never by raw URL (E5: menu items, page parents, …).
 * The search callback goes through the api client (TanStack Query in the screen hook).
 */

export type ReferenceItem = { id: string | number; label: string; hint?: string }

export function ReferencePicker({
  id,
  value,
  onChange,
  search,
  placeholder,
  className,
}: {
  id?: string
  value: ReferenceItem | null
  onChange: (value: ReferenceItem | null) => void
  /** Async record search (debounced here). */
  search: (query: string) => Promise<ReferenceItem[]>
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<ReferenceItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    const timer = setTimeout(() => {
      search(query)
        .then((results) => {
          if (!cancelled) setItems(results)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [open, query, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          <span className="truncate">{value ? value.label : (placeholder ?? t('reference.placeholder'))}</span>
          <span className="flex items-center gap-1">
            {value ? (
              <span
                role="button"
                tabIndex={-1}
                aria-label={t('common.delete')}
                className="rounded p-0.5 hover:bg-muted"
                onClick={(event) => {
                  event.stopPropagation()
                  onChange(null)
                }}
              >
                <X className="size-3.5" />
              </span>
            ) : null}
            <ChevronsUpDown className="size-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={t('common.search')} value={query} onValueChange={setQuery} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-4" />
              </div>
            ) : (
              <>
                <CommandEmpty>{t('reference.empty')}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={String(item.id)}
                      onSelect={() => {
                        onChange(item)
                        setOpen(false)
                      }}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint ? <span className="text-xs text-muted-foreground">{item.hint}</span> : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
