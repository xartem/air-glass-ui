import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  CalendarEvent,
  CalendarEventPayload,
  EventCategory,
} from "../types";

/*
 * In-memory mock of the calendar module. Shapes mirror the API DTOs (../types).
 * Persisted in localStorage so created/moved events survive reloads.
 */

const CATEGORIES: EventCategory[] = [
  "work",
  "personal",
  "meeting",
  "reminder",
  "holiday",
];
const TITLES = [
  "Team standup",
  "Design review",
  "1:1 with manager",
  "Sprint planning",
  "Client call",
  "Lunch break",
  "Dentist",
  "Product demo",
  "Release window",
  "Retrospective",
  "Interview",
  "Workshop",
];

let cache: CalendarEvent[] | null = null;
const KEY = "mock.calendar.events";

function atHour(day: Date, hour: number, minutes = 0): string {
  const date = new Date(day);
  date.setHours(hour, minutes, 0, 0);
  return date.toISOString();
}

function build(): CalendarEvent[] {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return Array.from({ length: 18 }, (_, index) => {
    const day = new Date(monthStart);
    day.setDate(1 + ((index * 5 + 2) % 27));
    const hour = 8 + (index % 9);
    const allDay = index % 6 === 0;
    return {
      id: 900 + index,
      title: TITLES[index % TITLES.length]!,
      start: allDay ? atHour(day, 0) : atHour(day, hour),
      end: allDay ? atHour(day, 23, 59) : atHour(day, hour + 1),
      category: CATEGORIES[index % CATEGORIES.length]!,
      all_day: allDay,
      description: "A demo calendar event used to showcase the calendar screens.",
    };
  });
}

function store(): CalendarEvent[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as CalendarEvent[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

export function listEvents(): CalendarEvent[] {
  devDebug("[mock:calendar] events");
  return structuredClone(store());
}

export function saveEvent(payload: CalendarEventPayload): CalendarEvent {
  devDebug("[mock:calendar] save", payload);
  if (!payload.title?.trim())
    throw new ValidationError("Validation failed", { title: "required" });
  const events = store();
  if (payload.id) {
    const event = events.find((entry) => entry.id === payload.id);
    if (!event) throw new ApiError(404, "Event not found");
    Object.assign(event, payload);
    persist();
    return structuredClone(event);
  }
  const created: CalendarEvent = {
    id: Math.max(0, ...events.map((entry) => entry.id)) + 1,
    title: payload.title,
    start: payload.start,
    end: payload.end,
    category: payload.category,
    all_day: payload.all_day,
    description: payload.description,
  };
  events.unshift(created);
  persist();
  return structuredClone(created);
}

export function moveEvent(id: number, start: string, end: string): CalendarEvent {
  devDebug("[mock:calendar] move", { id, start, end });
  const event = store().find((entry) => entry.id === id);
  if (!event) throw new ApiError(404, "Event not found");
  event.start = start;
  event.end = end;
  persist();
  return structuredClone(event);
}

export function deleteEvent(id: number): { ok: true } {
  devDebug("[mock:calendar] delete", id);
  const events = store();
  const at = events.findIndex((entry) => entry.id === id);
  if (at < 0) throw new ApiError(404, "Event not found");
  events.splice(at, 1);
  persist();
  return { ok: true };
}
