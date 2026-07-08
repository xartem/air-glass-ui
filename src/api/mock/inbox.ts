import { ApiError, ValidationError } from "../client";
import type {
  InboxFolder,
  InboxListPayload,
  InboxMessage,
  InboxThread,
  InboxThreadListItem,
} from "../types";

/*
 * In-memory mock of the inbox/chat module (build-demo-screen-catalog). Shapes
 * mirror the API DTOs (../types) exactly. Threads live in a module-level cache
 * so mark-read and send mutations persist within the session; a real messaging
 * backend can replace this layer without touching the screen.
 */

const PARTICIPANTS = [
  { name: "Olga Petrova", email: "olga@example.com" },
  { name: "James Wilson", email: "james@example.com" },
  { name: "María García", email: "maria@example.com" },
  { name: "Luca Rossi", email: "luca@example.com" },
  { name: "Anna Nowak", email: "anna@example.com" },
  { name: "Sophie Martin", email: "sophie@example.com" },
  { name: "Noah Schmidt", email: "noah@example.com" },
  { name: "Emma Johnson", email: "emma@example.com" },
];

const SUBJECTS = [
  "Question about my order",
  "Refund request #10422",
  "Partnership proposal",
  "Bug report: checkout page",
  "Invoice not received",
  "Feature request: dark mode",
  "Shipping delay",
  "Thanks for the quick help!",
  "Account access issue",
  "Bulk order inquiry",
  "Subscription renewal",
  "Product availability",
];

const BODIES = [
  "Hi there, I wanted to follow up on this — could you let me know the status?",
  "Thanks for getting back to me so quickly, that clears things up.",
  "Is there any update on this? It has been a couple of days.",
  "Appreciate the help. One more thing I forgot to mention…",
  "Perfect, that works for me. Looking forward to it.",
  "Could you double-check the details on your end? Something seems off.",
];

const FOLDERS: InboxFolder[] = ["inbox", "starred", "sent", "archived"];

let threadsCache: InboxThread[] | null = null;

function buildThreads(): InboxThread[] {
  const base = Date.now();
  return SUBJECTS.map((subject, index) => {
    const participant = PARTICIPANTS[index % PARTICIPANTS.length]!;
    const folder: InboxFolder =
      index % 7 === 0
        ? "archived"
        : index % 5 === 0
          ? "sent"
          : index % 3 === 0
            ? "starred"
            : "inbox";
    const messageCount = 2 + (index % 4);
    const messages: InboxMessage[] = Array.from(
      { length: messageCount },
      (_, m) => {
        const fromMe = m % 2 === 1;
        return {
          id: m + 1,
          author: fromMe ? "You" : participant.name,
          from_me: fromMe,
          body: BODIES[(index + m) % BODIES.length]!,
          at: new Date(
            base -
              (messageCount - m) * 3 * 3600 * 1000 -
              index * 6 * 3600 * 1000,
          ).toISOString(),
        };
      },
    );
    const labels =
      index % 4 === 0
        ? ["support"]
        : index % 4 === 1
          ? ["sales"]
          : index % 4 === 2
            ? ["billing"]
            : [];
    return {
      id: 600 + index,
      subject,
      participant: participant.name,
      email: participant.email,
      folder,
      labels,
      messages,
    };
  });
}

function threadsStore(): InboxThread[] {
  threadsCache ??= buildThreads();
  return threadsCache;
}

/** Unread state is derived: a thread is unread when its last message is inbound and not yet read. */
const readState = new Map<number, boolean>();

function isUnread(thread: InboxThread): boolean {
  if (readState.get(thread.id)) return false;
  const last = thread.messages.at(-1);
  return Boolean(last && !last.from_me);
}

function toListItem(thread: InboxThread): InboxThreadListItem {
  const last = thread.messages.at(-1);
  return {
    id: thread.id,
    subject: thread.subject,
    participant: thread.participant,
    preview: last?.body ?? "",
    last_at: last?.at ?? new Date(0).toISOString(),
    unread: isUnread(thread),
    folder: thread.folder,
    labels: thread.labels,
  };
}

function folderCounts(): Record<InboxFolder, number> {
  const counts = { inbox: 0, starred: 0, sent: 0, archived: 0 } as Record<
    InboxFolder,
    number
  >;
  for (const thread of threadsStore()) {
    if (isUnread(thread)) counts[thread.folder] += 1;
  }
  return counts;
}

export function listThreads(folder: InboxFolder, q?: string): InboxListPayload {
  const needle = q?.toLowerCase().trim();
  let rows = threadsStore().filter((thread) => thread.folder === folder);
  if (needle) {
    rows = rows.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(needle) ||
        thread.participant.toLowerCase().includes(needle),
    );
  }
  const threads = rows
    .map(toListItem)
    .sort((a, b) => b.last_at.localeCompare(a.last_at));
  return { threads, counts: folderCounts() };
}

export function getThread(id: number): InboxThread {
  const thread = threadsStore().find((item) => item.id === id);
  if (!thread) throw new ApiError(404, "Thread not found");
  return structuredClone(thread);
}

/** Append an outbound message (mock write). */
export function sendMessage(id: number, body: string): InboxThread {
  const trimmed = body.trim();
  if (!trimmed)
    throw new ValidationError("Validation failed", { body: "required" });
  const thread = threadsStore().find((item) => item.id === id);
  if (!thread) throw new ApiError(404, "Thread not found");
  thread.messages.push({
    id: (thread.messages.at(-1)?.id ?? 0) + 1,
    author: "You",
    from_me: true,
    body: trimmed,
    at: new Date().toISOString(),
  });
  readState.set(id, true);
  return structuredClone(thread);
}

/** Mark a thread read (mock write) — clears its unread badge. */
export function markRead(id: number): { ok: true } {
  const thread = threadsStore().find((item) => item.id === id);
  if (!thread) throw new ApiError(404, "Thread not found");
  readState.set(id, true);
  return { ok: true };
}

export const INBOX_FOLDERS = FOLDERS;
