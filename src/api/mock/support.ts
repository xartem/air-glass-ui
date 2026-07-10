import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  Paginated,
  TicketDetail,
  TicketFilters,
  TicketListItem,
  TicketPayload,
  TicketPriority,
  TicketStats,
  TicketStatus,
} from "../types";

/*
 * In-memory mock of the support-tickets module. Shapes mirror the API DTOs
 * (../types). Persisted in localStorage.
 */

const PER_PAGE = 12;
const STATUSES: TicketStatus[] = ["open", "pending", "solved", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];
const REQUESTERS = [
  "Olivia Parker",
  "David Fisher",
  "Mary Cooper",
  "Ian Walker",
  "Natalie Smith",
  "Paul Morrison",
  "Ellen Novak",
  "Simon Cole",
];
const AGENTS = ["Anna Adminson", "Evan Editor", "Olivia Parker"];
const SUBJECTS = [
  "Cannot log in to my account",
  "Refund not received",
  "Feature request: dark mode",
  "Billing question",
  "App crashes on export",
  "How do I reset my password?",
  "Integration with Slack",
  "Slow dashboard loading",
  "Missing invoice",
  "Change my email address",
  "Data import failed",
  "Question about pricing",
  "Bug in the calendar",
  "Cannot upload files",
];

let cache: TicketDetail[] | null = null;
const KEY = "mock.support.tickets";

function build(): TicketDetail[] {
  const base = Date.now();
  return SUBJECTS.map((subject, index) => {
    const requester = REQUESTERS[index % REQUESTERS.length]!;
    const first = requester.split(" ")[0]!.toLowerCase();
    const agent = AGENTS[index % AGENTS.length]!;
    return {
      id: 3000 + index,
      subject,
      requester,
      priority: PRIORITIES[index % PRIORITIES.length]!,
      status: STATUSES[index % STATUSES.length]!,
      agent,
      updated_at: new Date(base - index * 4 * 3600 * 1000).toISOString(),
      requester_email: `${first}@example.com`,
      created_at: new Date(base - (index + 2) * 20 * 3600 * 1000).toISOString(),
      tags: ["support", index % 2 === 0 ? "billing" : "bug"],
      messages: [
        {
          id: 1,
          author: requester,
          role: "customer",
          at: new Date(base - (index + 2) * 20 * 3600 * 1000).toISOString(),
          body: "Hi, I'm having an issue and would appreciate your help. Here are the details of what happened.",
        },
        {
          id: 2,
          author: agent,
          role: "agent",
          at: new Date(base - (index + 1) * 12 * 3600 * 1000).toISOString(),
          body: "Thanks for reaching out! I'm looking into this and will get back to you shortly.",
        },
      ],
      activity: [
        {
          id: 1,
          at: new Date(base - (index + 2) * 20 * 3600 * 1000).toISOString(),
          text: "Ticket created.",
        },
        {
          id: 2,
          at: new Date(base - (index + 1) * 12 * 3600 * 1000).toISOString(),
          text: `Assigned to ${agent}.`,
        },
      ],
    };
  });
}

function store(): TicketDetail[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as TicketDetail[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

function toListItem(ticket: TicketDetail): TicketListItem {
  return {
    id: ticket.id,
    subject: ticket.subject,
    requester: ticket.requester,
    priority: ticket.priority,
    status: ticket.status,
    agent: ticket.agent,
    updated_at: ticket.updated_at,
  };
}

export function ticketStats(): TicketStats {
  const tickets = store();
  return {
    open: tickets.filter((ticket) => ticket.status === "open").length,
    pending: tickets.filter((ticket) => ticket.status === "pending").length,
    avg_response: "2h 14m",
  };
}

export function listTickets(filters: TicketFilters): Paginated<TicketListItem> {
  devDebug("[mock:support] list", filters);
  let rows = store().slice();
  const q = filters.q?.toLowerCase().trim();
  if (q)
    rows = rows.filter(
      (ticket) =>
        ticket.subject.toLowerCase().includes(q) ||
        ticket.requester.toLowerCase().includes(q),
    );
  if (filters.status)
    rows = rows.filter((ticket) => ticket.status === filters.status);
  if (filters.priority)
    rows = rows.filter((ticket) => ticket.priority === filters.priority);
  if (filters.agent)
    rows = rows.filter((ticket) => ticket.agent === filters.agent);
  const sort = filters.sort ?? "updated_at";
  const dir = filters.dir === "asc" ? 1 : -1;
  rows.sort((a, b) =>
    sort === "subject"
      ? a.subject.localeCompare(b.subject) * dir
      : a.updated_at.localeCompare(b.updated_at) * dir,
  );
  const page = Math.max(1, filters.page ?? 1);
  return {
    rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toListItem),
    total: rows.length,
    page,
    per_page: PER_PAGE,
  };
}

export function getTicket(id: number): TicketDetail {
  devDebug("[mock:support] get", id);
  const ticket = store().find((entry) => entry.id === id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  return structuredClone(ticket);
}

export function createTicket(payload: TicketPayload): TicketDetail {
  devDebug("[mock:support] create", payload);
  if (!payload.subject?.trim())
    throw new ValidationError("Validation failed", { subject: "required" });
  if (!payload.requester?.trim())
    throw new ValidationError("Validation failed", { requester: "required" });
  const tickets = store();
  const id = Math.max(0, ...tickets.map((entry) => entry.id)) + 1;
  const now = new Date().toISOString();
  const created: TicketDetail = {
    id,
    subject: payload.subject,
    requester: payload.requester,
    priority: payload.priority,
    status: "open",
    agent: AGENTS[0]!,
    updated_at: now,
    requester_email: `${payload.requester.split(" ")[0]?.toLowerCase() ?? "user"}@example.com`,
    created_at: now,
    tags: ["support"],
    messages: [
      {
        id: 1,
        author: payload.requester,
        role: "customer",
        at: now,
        body: payload.message,
      },
    ],
    activity: [{ id: 1, at: now, text: "Ticket created." }],
  };
  tickets.unshift(created);
  persist();
  return structuredClone(created);
}

export function replyTicket(id: number, body: string): TicketDetail {
  devDebug("[mock:support] reply", id);
  const ticket = store().find((entry) => entry.id === id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (!body.trim())
    throw new ValidationError("Validation failed", { body: "required" });
  ticket.messages.push({
    id: (ticket.messages.at(-1)?.id ?? 0) + 1,
    author: "Anna Adminson",
    role: "agent",
    at: new Date().toISOString(),
    body: body.trim(),
  });
  ticket.updated_at = new Date().toISOString();
  persist();
  return structuredClone(ticket);
}

export function setTicketStatus(
  id: number,
  status: TicketStatus,
): TicketDetail {
  devDebug("[mock:support] setStatus", { id, status });
  const ticket = store().find((entry) => entry.id === id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  ticket.status = status;
  ticket.updated_at = new Date().toISOString();
  persist();
  return structuredClone(ticket);
}

export function assignTicket(id: number, agent: string): TicketDetail {
  devDebug("[mock:support] assign", { id, agent });
  const ticket = store().find((entry) => entry.id === id);
  if (!ticket) throw new ApiError(404, "Ticket not found");
  ticket.agent = agent;
  ticket.updated_at = new Date().toISOString();
  persist();
  return structuredClone(ticket);
}
