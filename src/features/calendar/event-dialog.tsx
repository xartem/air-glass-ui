import { useEffect, useState } from "react";

import type { CalendarEventPayload, EventCategory } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* Shared create/edit event dialog for the calendar screens. */

export const EVENT_CATEGORIES: EventCategory[] = [
  "work",
  "personal",
  "meeting",
  "reminder",
  "holiday",
];

export function emptyEvent(day: Date): CalendarEventPayload {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = new Date(day);
  end.setHours(10, 0, 0, 0);
  return {
    title: "",
    start: start.toISOString(),
    end: end.toISOString(),
    category: "work",
    all_day: false,
    description: "",
  };
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

export function EventDialog({
  value,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  value: CalendarEventPayload | null;
  onClose: () => void;
  onSave: (payload: CalendarEventPayload) => void;
  onDelete: (id: number) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<CalendarEventPayload | null>(value);
  useEffect(() => setDraft(value), [value]);
  if (!draft) return null;

  const set = (patch: Partial<CalendarEventPayload>) =>
    setDraft((current) => (current ? { ...current, ...patch } : current));

  return (
    <Dialog open={value !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {draft.id ? t("calendar.edit_event") : t("calendar.new_event")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="event-title">{t("calendar.field.title")}</Label>
            <Input
              id="event-title"
              value={draft.title}
              onChange={(event) => set({ title: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-start">{t("calendar.field.start")}</Label>
              <Input
                id="event-start"
                type="datetime-local"
                value={toLocalInput(draft.start)}
                onChange={(event) =>
                  set({ start: new Date(event.target.value).toISOString() })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-end">{t("calendar.field.end")}</Label>
              <Input
                id="event-end"
                type="datetime-local"
                value={toLocalInput(draft.end)}
                onChange={(event) =>
                  set({ end: new Date(event.target.value).toISOString() })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event-category">
                {t("calendar.field.category")}
              </Label>
              <Select
                value={draft.category}
                onValueChange={(category) =>
                  set({ category: category as EventCategory })
                }
              >
                <SelectTrigger id="event-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {t(`calendar.category.${category}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 pb-2 text-sm">
              <Switch
                checked={draft.all_day}
                onCheckedChange={(checked) => set({ all_day: checked })}
              />
              {t("calendar.field.all_day")}
            </label>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="event-desc">{t("calendar.field.description")}</Label>
            <Textarea
              id="event-desc"
              rows={2}
              value={draft.description}
              onChange={(event) => set({ description: event.target.value })}
            />
          </div>
        </div>
        <DialogFooter className={cn(draft.id && "sm:justify-between")}>
          {draft.id ? (
            <Button
              variant="ghost"
              className="text-destructive"
              onClick={() => onDelete(draft.id!)}
            >
              {t("common.delete")}
            </Button>
          ) : null}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => onSave(draft)} disabled={saving}>
              {t("common.save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
