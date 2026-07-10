import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type { TodoItem, TodoPriority } from "../types";

/*
 * In-memory mock of the personal to-do module. Shapes mirror the API DTOs
 * (../types). Persisted in localStorage; the array order is the display order.
 */

const PRIORITIES: TodoPriority[] = ["low", "medium", "high"];
const TITLES = [
  "Reply to design feedback",
  "Prepare weekly report",
  "Book flight for conference",
  "Review pull request",
  "Call the accountant",
  "Update project roadmap",
  "Water the office plants",
  "Draft newsletter",
  "Renew domain",
  "Plan team lunch",
];

let cache: TodoItem[] | null = null;
const KEY = "mock.todo";

function build(): TodoItem[] {
  const base = Date.now();
  return TITLES.map((title, index) => ({
    id: 4000 + index,
    title,
    done: index % 4 === 3,
    priority: PRIORITIES[index % PRIORITIES.length]!,
    due:
      index % 3 === 0
        ? new Date(base + (index - 2) * 24 * 3600 * 1000).toISOString()
        : null,
  }));
}

function store(): TodoItem[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as TodoItem[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

export function listTodos(): TodoItem[] {
  devDebug("[mock:todo] list");
  return structuredClone(store());
}

export function addTodo(title: string, priority: TodoPriority): TodoItem {
  devDebug("[mock:todo] add", { title, priority });
  if (!title.trim())
    throw new ValidationError("Validation failed", { title: "required" });
  const todos = store();
  const created: TodoItem = {
    id: Math.max(0, ...todos.map((entry) => entry.id)) + 1,
    title: title.trim(),
    done: false,
    priority,
    due: null,
  };
  todos.unshift(created);
  persist();
  return structuredClone(created);
}

export function toggleTodo(id: number): TodoItem {
  devDebug("[mock:todo] toggle", id);
  const todo = store().find((entry) => entry.id === id);
  if (!todo) throw new ApiError(404, "Todo not found");
  todo.done = !todo.done;
  persist();
  return structuredClone(todo);
}

export function reorderTodos(ids: number[]): TodoItem[] {
  devDebug("[mock:todo] reorder", ids);
  const todos = store();
  const byId = new Map(todos.map((entry) => [entry.id, entry]));
  const next = ids.map((id) => byId.get(id)).filter(Boolean) as TodoItem[];
  // Keep any items not present in the reorder payload appended at the end.
  for (const todo of todos) if (!ids.includes(todo.id)) next.push(todo);
  cache = next;
  persist();
  return structuredClone(next);
}

export function removeTodo(id: number): { ok: true } {
  devDebug("[mock:todo] remove", id);
  const todos = store();
  const at = todos.findIndex((entry) => entry.id === id);
  if (at < 0) throw new ApiError(404, "Todo not found");
  todos.splice(at, 1);
  persist();
  return { ok: true };
}
