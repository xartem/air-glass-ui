import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, format } from "date-fns";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { api, type CalendarEvent, type CalendarEventPayload } from "@/api";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthGrid } from "@/features/calendar/month-grid";
import { EventDialog, emptyEvent } from "@/features/calendar/event-dialog";
import { t } from "@/lib/i18n";

/*
 * /calendar/month — dense, full-bleed month-only variant of the calendar reusing
 * the shared MonthGrid (dense prop). Reachable with calendar.view.
 */

export function MonthGridPage() {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(() => new Date());
  const [editing, setEditing] = useState<CalendarEventPayload | null>(null);

  const query = useQuery({
    queryKey: ["calendar", "events"],
    queryFn: api.calendar.events,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: CalendarEventPayload) => api.calendar.save(payload),
    onSuccess: () => {
      toast.success(t("calendar.saved"));
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
      setEditing(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.calendar.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
      setEditing(null);
    },
    onError: () => toast.error(t("common.request_failed")),
  });
  const moveMutation = useMutation({
    mutationFn: ({
      id,
      start,
      end,
    }: {
      id: number;
      start: string;
      end: string;
    }) => api.calendar.move(id, start, end),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] }),
    onError: () => {
      toast.error(t("common.request_failed"));
      void queryClient.invalidateQueries({ queryKey: ["calendar", "events"] });
    },
  });

  function moveEvent(event: CalendarEvent, day: Date) {
    const deltaDays = Math.round(
      (day.setHours(0, 0, 0, 0) - new Date(event.start).setHours(0, 0, 0, 0)) /
        (24 * 3600 * 1000),
    );
    moveMutation.mutate({
      id: event.id,
      start: addDays(new Date(event.start), deltaDays).toISOString(),
      end: addDays(new Date(event.end), deltaDays).toISOString(),
    });
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("calendar.month_title")} icon={CalendarRange} />

      <Panel
        title={format(current, "MMMM yyyy")}
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("calendar.prev")}
              onClick={() => setCurrent((date) => addMonths(date, -1))}
            >
              <ChevronLeft className="rtl:-scale-x-100" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrent(new Date())}
            >
              {t("calendar.today")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("calendar.next")}
              onClick={() => setCurrent((date) => addMonths(date, 1))}
            >
              <ChevronRight className="rtl:-scale-x-100" />
            </Button>
          </div>
        }
      >
        {query.isPending ? (
          <Skeleton className="h-[32rem] rounded-2xl" />
        ) : (
          <MonthGrid
            month={current}
            events={query.data ?? []}
            dense
            onDayClick={(day) => setEditing(emptyEvent(day))}
            onEventClick={(event) => setEditing({ ...event })}
            onMoveEvent={moveEvent}
          />
        )}
      </Panel>

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
