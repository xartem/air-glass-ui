import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  Paginated,
  ProjectDetail,
  ProjectFile,
  ProjectFilters,
  ProjectListItem,
  ProjectPayload,
  ProjectStatus,
  ProjectTaskRow,
  ProjectTeamMember,
  TaskStatus,
} from "../types";

/*
 * In-memory mock of the projects module. Shapes mirror the API DTOs (../types).
 * Datasets persist in localStorage so created projects survive reloads.
 */

const CURRENCY = "USD";
const PER_PAGE = 12;

const PROJECT_NAMES = [
  "Website Redesign",
  "Mobile App v2",
  "Brand Refresh",
  "Data Warehouse Migration",
  "Marketing Campaign Q3",
  "Customer Portal",
  "Internal Wiki",
  "API Platform",
  "Onboarding Revamp",
  "Analytics Dashboard",
  "Payment Integration",
  "Design System",
  "Security Audit",
  "Localization Rollout",
];
const CLIENTS = [
  "Acme Inc.",
  "Globex",
  "Initech",
  "Umbrella Co.",
  "Soylent",
  "Hooli",
  "Vandelay",
  "Stark Industries",
];
const TEAM: ProjectTeamMember[] = [
  { id: 1, name: "Anna Adminson" },
  { id: 2, name: "Evan Editor" },
  { id: 3, name: "Olivia Parker" },
  { id: 4, name: "David Fisher" },
  { id: 5, name: "Mary Cooper" },
  { id: 6, name: "Ian Walker" },
];
const STATUSES: ProjectStatus[] = [
  "planning",
  "active",
  "active",
  "on_hold",
  "completed",
];
const TASK_STATUSES: TaskStatus[] = ["todo", "in_progress", "review", "done"];

export const PROJECT_TEAM_OPTIONS = TEAM;

let cache: ProjectDetail[] | null = null;
const KEY = "mock.projects";

function build(): ProjectDetail[] {
  const base = Date.now();
  return PROJECT_NAMES.map((name, index) => {
    const status = STATUSES[index % STATUSES.length]!;
    const progress =
      status === "completed"
        ? 100
        : status === "planning"
          ? 5 + (index % 3) * 8
          : 20 + ((index * 13) % 70);
    const teamSize = 2 + (index % 4);
    const team = TEAM.slice(0, teamSize);
    const start = new Date(base - (index + 4) * 14 * 24 * 3600 * 1000);
    const deadline = new Date(base + ((index % 8) + 2) * 9 * 24 * 3600 * 1000);
    const tasksTotal = 8 + (index % 12);
    const tasksDone = Math.round((tasksTotal * progress) / 100);
    const budget = 10000 + ((index * 37) % 40) * 2500;
    return {
      id: 100 + index,
      name,
      client: CLIENTS[index % CLIENTS.length]!,
      status,
      progress,
      deadline: deadline.toISOString(),
      team,
      description:
        "A demo project used to showcase the projects list and overview screens. It bundles milestones, tasks, files and activity.",
      start_date: start.toISOString(),
      budget,
      budget_used: Math.round((budget * progress) / 100),
      currency: CURRENCY,
      tasks_total: tasksTotal,
      tasks_done: tasksDone,
      tags: ["design", "internal", "q3"].slice(0, 1 + (index % 3)),
      milestones: Array.from({ length: 4 }, (_, m) => ({
        id: m + 1,
        title: `Milestone ${m + 1}`,
        due: new Date(
          start.getTime() + (m + 1) * 14 * 24 * 3600 * 1000,
        ).toISOString(),
        done: m < Math.round((4 * progress) / 100),
      })),
      activity: Array.from({ length: 5 }, (_, a) => ({
        id: a + 1,
        at: new Date(base - (a + 1) * 12 * 3600 * 1000).toISOString(),
        text: `${TEAM[a % TEAM.length]!.name} updated the project.`,
      })),
    };
  });
}

function store(): ProjectDetail[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as ProjectDetail[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

function toListItem(project: ProjectDetail): ProjectListItem {
  return {
    id: project.id,
    name: project.name,
    client: project.client,
    status: project.status,
    progress: project.progress,
    deadline: project.deadline,
    team: project.team,
  };
}

export function listProjects(
  filters: ProjectFilters,
): Paginated<ProjectListItem> {
  devDebug("[mock:projects] list", filters);
  let rows = store().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        project.client.toLowerCase().includes(q),
    );
  if (filters.status)
    rows = rows.filter((project) => project.status === filters.status);
  const sort = filters.sort ?? "name";
  const dir = filters.dir === "desc" ? -1 : 1;
  rows.sort((a, b) => {
    if (sort === "deadline") return a.deadline.localeCompare(b.deadline) * dir;
    if (sort === "progress") return (a.progress - b.progress) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toListItem),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function getProject(id: number): ProjectDetail {
  devDebug("[mock:projects] get", id);
  const project = store().find((entry) => entry.id === id);
  if (!project) throw new ApiError(404, "Project not found");
  return structuredClone(project);
}

export function projectTasks(id: number): ProjectTaskRow[] {
  devDebug("[mock:projects] tasks", id);
  const project = store().find((entry) => entry.id === id);
  if (!project) throw new ApiError(404, "Project not found");
  return Array.from({ length: 6 }, (_, index) => ({
    id: id * 100 + index,
    title: `Task ${index + 1} for ${project.name}`,
    assignee: project.team[index % project.team.length]!.name,
    status: TASK_STATUSES[index % TASK_STATUSES.length]!,
    due: new Date(
      Date.parse(project.start_date) + (index + 3) * 3 * 24 * 3600 * 1000,
    ).toISOString(),
  }));
}

export function projectFiles(id: number): ProjectFile[] {
  devDebug("[mock:projects] files", id);
  const names = [
    "brief.pdf",
    "wireframes.fig",
    "budget.xlsx",
    "notes.md",
    "logo.svg",
  ];
  const base = Date.now();
  return names.map((name, index) => ({
    id: id * 10 + index,
    name,
    size: 40_000 + index * 120_000,
    uploaded_at: new Date(base - (index + 1) * 30 * 3600 * 1000).toISOString(),
  }));
}

export function createProject(payload: ProjectPayload): ProjectDetail {
  devDebug("[mock:projects] create", payload);
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  if (!payload.client?.trim())
    throw new ValidationError("Validation failed", { client: "required" });
  const projects = store();
  const id = Math.max(0, ...projects.map((project) => project.id)) + 1;
  const team = TEAM.filter((member) => payload.team.includes(member.id));
  const now = Date.now();
  const created: ProjectDetail = {
    id,
    name: payload.name,
    client: payload.client,
    status: payload.status,
    progress: 0,
    deadline:
      payload.end_date || new Date(now + 30 * 24 * 3600 * 1000).toISOString(),
    team: team.length > 0 ? team : [TEAM[0]!],
    description: payload.description,
    start_date: payload.start_date || new Date(now).toISOString(),
    budget: payload.budget,
    budget_used: 0,
    currency: CURRENCY,
    tasks_total: 0,
    tasks_done: 0,
    tags: payload.tags,
    milestones: [],
    activity: [
      { id: 1, at: new Date(now).toISOString(), text: "Project created." },
    ],
  };
  projects.unshift(created);
  persist();
  return structuredClone(created);
}
