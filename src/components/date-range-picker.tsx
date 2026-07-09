import { useState } from 'react'
import { de, enUS, es, fr, it, pl, ru, uk } from 'date-fns/locale'
import { CalendarIcon, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { t, type AdminLocale } from '@/lib/i18n'
import { useLocale } from '@/lib/use-locale'
import { cn } from '@/lib/utils'

/*
 * DateRangePicker — shared library control (E6): a period filter for lists
 * (first consumer: /system/activity per UI:shell-auth §2). Value is a pair of
 * `YYYY-MM-DD` strings so it round-trips through URL search params untouched.
 */

const DATE_LOCALES: Record<AdminLocale, typeof ru> = { ru, en: enUS, uk, de, fr, es, it, pl }

export interface DateRangeValue {
  from?: string
  to?: string
}

/** Parse as a LOCAL date — `new Date('YYYY-MM-DD')` is UTC and shifts a day in western TZs. */
function parseDay(value?: string): Date | undefined {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function serializeDay(date?: Date): string | undefined {
  if (!date) return undefined
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function DateRangePicker({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: DateRangeValue
  onChange: (next: DateRangeValue) => void
  placeholder?: string
  className?: string
}) {
  const locale = useLocale()
  const [open, setOpen] = useState(false)

  const from = parseDay(value.from)
  const to = parseDay(value.to)
  const selected: DateRange | undefined = from || to ? { from, to } : undefined
  const label = selected
    ? [from?.toLocaleDateString(locale), to?.toLocaleDateString(locale)].filter(Boolean).join(' — ')
    : (placeholder ?? t('common.date_range'))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start font-normal', !selected && 'text-muted-foreground', className)}
        >
          <CalendarIcon className="size-4" />
          <span className="truncate">{label}</span>
          {selected ? (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('common.clear')}
              className="ms-auto rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                onChange({})
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  onChange({})
                }
              }}
            >
              <X className="size-3.5" />
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={from}
          selected={selected}
          locale={DATE_LOCALES[locale]}
          onSelect={(range) => {
            onChange({ from: serializeDay(range?.from), to: serializeDay(range?.to) })
            if (range?.from && range?.to) setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
