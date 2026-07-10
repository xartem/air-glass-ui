import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  Paginated,
  TaskComment,
  TaskDetail,
  TaskFilters,
  TaskListItem,
  TaskPriority,
  TaskStatus,
} from "../types";

/*
 * In-memory mock of the tasks module. Shapes mirror the API DTOs (../types).
 * Persisted in localStorage so status changes / comments survive reloads.
 */

const PER_PAGE = 12;

const TASK_TITLES = [
  "Design landing hero",
  "Fix checkout bug",
  "Write API docs",
  "Review pull request",
  "Prepare Q3 report",
  "Update dependencies",
  "Onboard new vendor",
  "Refactor auth flow",
  "Add unit tests",
  "Localize dashboard",
  "Optimize images",
  "Draft release notes",
  "Migrate database",
  "Set up analytics",
  "Audit accessibility",
  "Plan sprint",
  "Triage support tickets",
  "Design email template",
  "Improve error states",
  "Benchmark queries",
];
const PROJECTS = [
  "Website Redesign",
  "Mobile App v2",
  "Brand Refresh",
  "Customer Portal",
  "API Platform",
];
const ASSIGNEES = [
  "Anna Adminson",
  "Evan Editor",
  "Olivia Parker",
  "David Fisher",
  "Mary Cooper",
];
const STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const LABELS = ["frontend", "backend", "design", "bug", "docs"];

let cache: TaskDetail[] | null = null;
const KEY = "mock.tasks";

function build(): TaskDetail[] {
  const base = Date.now();
  return TASK_TITLES.map((title, index) => ({
    id: 200 + index,
    title,
    project: PROJECTS[index % PROJECTS.length]!,
    assignee: ASSIGNEES[index % ASSIGNEES.length]!,
    priority: PRIORITIES[index % PRIORITIES.length]!,
    status: STATUSES[index % STATUSES.length]!,
    due: new Date(base + ((index % 10) - 3) * 24 * 3600 * 1000).toISOString(),
    description:
      "A demo task used to showcase the task list and details screens. It carries subtasks, comments and labels.",
    labels: LABELS.slice(0, 1 + (index % 3)),
    subtasks: Array.from({ length: 3 }, (_, s) => ({
      id: s + 1,
      title: `Subtask ${s + 1}`,
      done: s < index % 3,
    })),
    comments: Array.from({ length: 2 }, (_, c) => ({
      id: c + 1,
      author: ASSIGNEES[(index + c) % ASSIGNEES.length]!,
      at: new Date(base - (c + 1) * 6 * 3600 * 1000).toISOString(),
      body: "Looks good — leaving a demo comment here.",
    })),
    created_at: new Date(base - (index + 1) * 12 * 3600 * 1000).toISOString(),
  }));
}

function store(): TaskDetail[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as TaskDetail[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

function toListItem(task: TaskDetail): TaskListItem {
  return {
    id: task.id,
    title: task.title,
    project: task.project,
    assignee: task.assignee,
    priority: task.priority,
    status: task.status,
    due: task.due,
  };
}

export function listTasks(filters: TaskFilters): Paginated<TaskListItem> {
  devDebug("[mock:tasks] list", filters);
  let rows = store().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q) rows = rows.filter((task) => task.title.toLowerCase().includes(q));
  if (filters.project) rows = rows.filter((task) => task.project === filters.project);
  if (filters.assignee) rows = rows.filter((task) => task.assignee === filters.assignee);
  if (filters.priority) rows = rows.filter((task) => task.priority === filters.priority);
  if (filters.status) rows = rows.filter((task) => task.status === filters.status);
  const sort = filters.sort ?? "due";
  const dir = filters.dir === "desc" ? -1 : 1;
  const priorityRank: Record<TaskPriority, number> = {
    low: 0,
    medium: 1,
    high: 2,
    urgent: 3,
  };
  rows.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title) * dir;
    if (sort === "priority")
      return (priorityRank[a.priority] - priorityRank[b.priority]) * dir;
    return a.due.localeCompare(b.due) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toListItem),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function getTask(id: number): TaskDetail {
  devDebug("[mock:tasks] get", id);
  const task = store().find((entry) => entry.id === id);
  if (!task) throw new ApiError(404, "Task not found");
  return structuredClone(task);
}

export function setTaskStatus(id: number, status: TaskStatus): TaskListItem {
  devDebug("[mock:tasks] setStatus", { id, status });
  const task = store().find((entry) => entry.id === id);
  if (!task) throw new ApiError(404, "Task not found");
  task.status = status;
  persist();
  return toListItem(task);
}

export function addTaskComment(id: number, body: string): TaskComment {
  devDebug("[mock:tasks] comment", id);
  const task = store().find((entry) => entry.id === id);
  if (!task) throw new ApiError(404, "Task not found");
  if (!body.trim())
    throw new ValidationError("Validation failed", { body: "required" });
  const comment: TaskComment = {
    id: (task.comments.at(-1)?.id ?? 0) + 1,
    author: "Anna Adminson",
    at: new Date().toISOString(),
    body: body.trim(),
  };
  task.comments.push(comment);
  persist();
  return structuredClone(comment);
}

export function toggleSubtask(id: number, subtaskId: number): TaskDetail {
  devDebug("[mock:tasks] toggleSubtask", { id, subtaskId });
  const task = store().find((entry) => entry.id === id);
  if (!task) throw new ApiError(404, "Task not found");
  const subtask = task.subtasks.find((entry) => entry.id === subtaskId);
  if (subtask) subtask.done = !subtask.done;
  persist();
  return structuredClone(task);
}
