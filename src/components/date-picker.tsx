import { useState } from "react";
import { ar, de, enUS, es, fr, it, pl, ru, uk } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { t, type AdminLocale } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";
import { cn } from "@/lib/utils";

/*
 * DatePicker (E2 §7: field type `date` → this widget → ISO string).
 * Value is an ISO date string (yyyy-mm-dd); the display format AND the calendar
 * (weekday/month names) follow the admin UI locale.
 */

const DATE_LOCALES: Record<AdminLocale, typeof ru> = {
  ru,
  en: enUS,
  uk,
  de,
  fr,
  es,
  it,
  pl,
  ar,
};

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromIso(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  clearable = true,
  className,
}: {
  id?: string;
  /** ISO date string (yyyy-mm-dd) or undefined. */
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const selected = fromIso(value);
  const display = selected
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selected)
    : (placeholder ?? t("datepicker.placeholder"));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Clear control is a real sibling <button>, not a span nested inside the
          trigger button — keyboard-operable and no interactive-in-interactive
          nesting (WCAG 2.1.1, 4.1.2). */}
      <div className="relative">
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
              clearable && selected && "pe-10",
              className,
            )}
          >
            <CalendarIcon className="size-4" />
            <span className="flex-1 text-start">{display}</span>
          </Button>
        </PopoverTrigger>
        {clearable && selected ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("datepicker.clear")}
            className="absolute end-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => onChange(undefined)}
          >
            <X className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={DATE_LOCALES[locale]}
          selected={selected}
          onSelect={(date: Date | undefined) => {
            onChange(date ? toIso(date) : undefined);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
