import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { api, type CalendarEvent, type CalendarEventPayload } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORY_VAR, MonthGrid } from "@/features/calendar/month-grid";
import {
  EVENT_CATEGORIES,
  EventDialog,
  emptyEvent,
} from "@/features/calendar/event-dialog";
import { t } from "@/lib/i18n";

/*
 * /calendar — month/week/day calendar with a hand-rolled month grid, an aside
 * (category legend, upcoming events, mini month picker) and a create/edit event
 * dialog. Drag a chip to another day to reschedule. Reachable with calendar.view.
 */

type View = "month" | "week" | "day";
const VIEWS: View[] = ["month", "week", "day"];
const HOURS = Array.from({ length: 14 }, (_, index) => index + 7);

export function CalendarPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("month");
  const [current, setCurrent] = useState(() => new Date());
  const [editing, setEditing] = useState<CalendarEventPayload | null>(null);

  const query = useQuery({
    queryKey: ["calendar", "events"],
    queryFn: api.calendar.events,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: CalendarEventPayload) => {
      console.debug("[CalendarPage] save", payload);
      return api.calendar.save(payload);
    },
    onSuccess: () => {
      toast.success(t("calendar.saved"));
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
      setEditing(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      console.debug("[CalendarPage] delete", id);
      return api.calendar.delete(id);
    },
    onSuccess: () => {
      toast.success(t("calendar.deleted"));
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
      setEditing(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, start, end }: { id: number; start: string; end: string }) => {
      console.debug("[CalendarPage] move", { id, start, end });
      return api.calendar.move(id, start, end);
    },
    onError: () => {
      toast.error(t("common.request_failed"));
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  const events = useMemo(() => query.data ?? [], [query.data]);

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((event) => new Date(event.start).getTime() >= Date.now() - 3600_000)
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 5),
    [events],
  );

  const shift = (direction: 1 | -1) => {
    setCurrent((date) =>
      view === "month"
        ? addMonths(date, direction)
        : view === "week"
          ? addWeeks(date, direction)
          : addDays(date, direction),
    );
  };

  function moveEvent(event: CalendarEvent, day: Date) {
    const deltaDays = Math.round(
      (day.setHours(0, 0, 0, 0) - new Date(event.start).setHours(0, 0, 0, 0)) /
        (24 * 3600 * 1000),
    );
    const newStart = addDays(new Date(event.start), deltaDays);
    const newEnd = addDays(new Date(event.end), deltaDays);
    moveMutation.mutate({
      id: event.id,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
    });
  }

  const title =
    view === "month"
      ? format(current, "MMMM yyyy")
      : view === "week"
        ? `${format(startOfWeek(current, { weekStartsOn: 0 }), "MMM d")} – ${format(endOfWeek(current, { weekStartsOn: 0 }), "MMM d")}`
        : format(current, "EEEE, MMM d");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("nav.calendar")}
        icon={CalendarDays}
        primaryAction={{
          label: t("calendar.new_event"),
          onClick: () => setEditing(emptyEvent(current)),
          permission: "calendar.view",
        }}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_16rem]">
        <Panel
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("calendar.prev")}
                  onClick={() => shift(-1)}
                >
                  <ChevronLeft className="rtl:-scale-x-100" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrent(new Date())}>
                  {t("calendar.today")}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("calendar.next")}
                  onClick={() => shift(1)}
                >
                  <ChevronRight className="rtl:-scale-x-100" />
                </Button>
              </div>
              <div className="flex items-center gap-1 rounded-lg border p-0.5">
                {VIEWS.map((entry) => (
                  <Button
                    key={entry}
                    variant={view === entry ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView(entry)}
                  >
                    {t(`calendar.view.${entry}`)}
                  </Button>
                ))}
              </div>
            </div>
          }
          title={title}
        >
          {query.isPending ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : view === "month" ? (
            <MonthGrid
              month={current}
              events={events}
              onDayClick={(day) => setEditing(emptyEvent(day))}
              onEventClick={(event) => setEditing({ ...event })}
              onMoveEvent={moveEvent}
            />
          ) : view === "week" ? (
            <WeekView
              current={current}
              events={events}
              onEventClick={(event) => setEditing({ ...event })}
              onDayClick={(day) => setEditing(emptyEvent(day))}
            />
          ) : (
            <DayView
              current={current}
              events={events}
              onEventClick={(event) => setEditing({ ...event })}
              onSlotClick={(day) => setEditing(emptyEvent(day))}
            />
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title={t("calendar.categories")}>
            <ul className="space-y-2">
              {EVENT_CATEGORIES.map((category) => (
                <li key={category} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: CATEGORY_VAR[category] }}
                  />
                  {t(`calendar.category.${category}`)}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={t("calendar.upcoming")}>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("calendar.no_upcoming")}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...event })}
                      className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-start text-sm hover:bg-accent/40"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: CATEGORY_VAR[event.category] }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {event.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {format(new Date(event.start), "MMM d")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel contentClassName="flex justify-center p-2">
            <Calendar
              mode="single"
              selected={current}
              onSelect={(day) => day && setCurrent(day)}
              month={current}
              onMonthChange={setCurrent}
            />
          </Panel>
        </div>
      </div>

      <EventDialog
        value={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => saveMutation.mutate(payload)}
        onDelete={(id) => deleteMutation.mutate(id)}
        saving={saveMutation.isPending}
      />
    </div>
  );
}

function WeekView({
  current,
  events,
  onEventClick,
  onDayClick,
}: {
  current: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (day: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(current, { weekStartsOn: 0 }),
    end: endOfWeek(current, { weekStartsOn: 0 }),
  });
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((event) => isSameDay(new Date(event.start), day))
          .sort((a, b) => a.start.localeCompare(b.start));
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onDayClick(day)}
            className="flex min-h-40 flex-col gap-1 rounded-xl border border-border/50 p-2 text-start"
          >
            <span className="text-xs font-medium text-muted-foreground">
              {format(day, "EEE d")}
            </span>
            {dayEvents.map((event) => (
              <span
                key={event.id}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onEventClick(event);
                  }
                }}
                className="truncate rounded px-1.5 py-0.5 text-[11px] text-white/95"
                style={{ backgroundColor: CATEGORY_VAR[event.category] }}
              >
                {event.title}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}

function DayView({
  current,
  events,
  onEventClick,
  onSlotClick,
}: {
  current: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (day: Date) => void;
}) {
  const dayEvents = events.filter((event) => isSameDay(new Date(event.start), current));
  return (
    <div className="divide-y divide-border/50">
      {HOURS.map((hour) => {
        const slotEvents = dayEvents.filter(
          (event) => new Date(event.start).getHours() === hour,
        );
        const slotDate = new Date(current);
        slotDate.setHours(hour, 0, 0, 0);
        return (
          <div key={hour} className="flex gap-3 py-2">
            <span className="w-12 shrink-0 pt-0.5 text-xs tabular-nums text-muted-foreground">
              {String(hour).padStart(2, "0")}:00
            </span>
            <button
              type="button"
              onClick={() => onSlotClick(slotDate)}
              className="min-h-8 flex-1 space-y-1 rounded-lg px-2 py-1 text-start hover:bg-accent/30"
            >
              {slotEvents.map((event) => (
                <span
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.stopPropagation();
                      onEventClick(event);
                    }
                  }}
                  className="block truncate rounded px-2 py-1 text-xs text-white/95"
                  style={{ backgroundColor: CATEGORY_VAR[event.category] }}
                >
                  {event.title}
                </span>
              ))}
            </button>
          </div>
        );
      })}
    </div>
  );
}
