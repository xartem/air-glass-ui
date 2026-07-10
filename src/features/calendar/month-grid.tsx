import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { CalendarEvent, EventCategory } from "@/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/*
 * Hand-rolled month grid (6×7) built on date-fns. Shared by the Main Calendar
 * and the dense Month Grid variant. Event chips are draggable (dnd-kit) onto day
 * cells to reschedule; clicking a day creates, clicking a chip edits.
 */

export const CATEGORY_VAR: Record<EventCategory, string> = {
  work: "var(--chart-1)",
  personal: "var(--chart-2)",
  meeting: "var(--chart-3)",
  reminder: "var(--chart-4)",
  holiday: "var(--chart-5)",
};

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

function EventChip({
  event,
  onClick,
  dense,
}: {
  event: CalendarEvent;
  onClick: () => void;
  dense?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `event-${event.id}`,
    data: { event },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      {...attributes}
      {...listeners}
      className={cn(
        "flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-start text-[11px] text-white/95",
        isDragging && "opacity-40",
      )}
      style={{ backgroundColor: CATEGORY_VAR[event.category] }}
    >
      {!event.all_day && !dense ? (
        <span className="shrink-0 tabular-nums opacity-90">
          {format(new Date(event.start), "HH:mm")}
        </span>
      ) : null}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

function DayCell({
  day,
  month,
  events,
  onDayClick,
  onEventClick,
  dense,
}: {
  day: Date;
  month: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  dense?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${day.toISOString()}`,
    data: { day },
  });
  const inMonth = isSameMonth(day, month);
  const max = dense ? 2 : 3;
  const shown = events.slice(0, max);
  const overflow = events.length - shown.length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-24 flex-col gap-1 border-b border-e border-border/50 p-1.5 transition-colors",
        !inMonth && "bg-muted/30 text-muted-foreground",
        isOver && "bg-primary/5",
      )}
    >
      <button
        type="button"
        onClick={() => onDayClick(day)}
        className="flex items-center justify-between text-start"
      >
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
            isToday(day) && "bg-primary font-semibold text-primary-foreground",
          )}
        >
          {format(day, "d")}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-0.5">
        {shown.map((event) => (
          <EventChip
            key={event.id}
            event={event}
            dense={dense}
            onClick={() => onEventClick(event)}
          />
        ))}
        {overflow > 0 ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="rounded px-1.5 py-0.5 text-start text-[11px] text-muted-foreground hover:bg-accent/40"
              >
                {t("calendar.more", { count: overflow })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 space-y-1 p-2" align="start">
              {events.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    </div>
  );
}

export function MonthGrid({
  month,
  events,
  onDayClick,
  onEventClick,
  onMoveEvent,
  dense,
}: {
  month: Date;
  events: CalendarEvent[];
  onDayClick: (day: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onMoveEvent: (event: CalendarEvent, day: Date) => void;
  dense?: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });

  const eventsForDay = (day: Date) =>
    events
      .filter((event) => isSameDay(new Date(event.start), day))
      .sort((a, b) => a.start.localeCompare(b.start));

  const onDragEnd = (dragEvent: DragEndEvent) => {
    const { active, over } = dragEvent;
    if (!over) return;
    const event = active.data.current?.event as CalendarEvent | undefined;
    const day = over.data.current?.day as Date | undefined;
    if (event && day && !isSameDay(new Date(event.start), day)) {
      onMoveEvent(event, day);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="overflow-hidden rounded-2xl border-s border-t border-border/50">
        <div className="grid grid-cols-7">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="border-b border-e border-border/50 bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground"
            >
              {t(`calendar.weekday.${weekday}`)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => (
            <DayCell
              key={day.toISOString()}
              day={day}
              month={month}
              events={eventsForDay(day)}
              onDayClick={onDayClick}
              onEventClick={onEventClick}
              dense={dense}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

export function categoryLabel(category: EventCategory): string {
  return t(`calendar.category.${category}`);
}

export { addDays };
