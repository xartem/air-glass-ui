import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  MailFolder,
  MailListPayload,
  MailMessage,
  MailSendPayload,
} from "../types";

/*
 * In-memory mock of the mailbox module. Shapes mirror the API DTOs (../types).
 * Persisted in localStorage so read/star/move/sent state survives reloads.
 */

const FOLDERS: MailFolder[] = ["inbox", "sent", "drafts", "spam", "trash"];
const SENDERS = [
  ["Olivia Parker", "olivia@example.com"],
  ["David Fisher", "david@acme.test"],
  ["Mary Cooper", "mary@globex.test"],
  ["Support Team", "support@airglass.example"],
  ["Ian Walker", "ian@initech.test"],
  ["Newsletter", "news@updates.example"],
];
const SUBJECTS = [
  "Welcome aboard!",
  "Your invoice is ready",
  "Weekly product update",
  "Re: Project timeline",
  "Action required: verify your account",
  "Meeting notes from today",
  "New comment on your task",
  "Your order has shipped",
  "Password changed successfully",
  "Invitation to collaborate",
];
const LABELS = ["work", "personal", "promo"];

let cache: MailMessage[] | null = null;
const KEY = "mock.email.messages";

function build(): MailMessage[] {
  const base = Date.now();
  return Array.from({ length: 28 }, (_, index) => {
    const folder: MailFolder =
      index % 9 === 8
        ? "spam"
        : index % 7 === 6
          ? "drafts"
          : index % 5 === 4
            ? "sent"
            : "inbox";
    const [name, email] = SENDERS[index % SENDERS.length]!;
    return {
      id: 1000 + index,
      folder,
      from_name: name!,
      from_email: email!,
      to: "me@airglass.example",
      subject: SUBJECTS[index % SUBJECTS.length]!,
      preview:
        "This is a demo email used to showcase the mailbox screen. It carries a subject, preview and body.",
      body:
        "Hi there,\n\nThis is a demo email body rendered in the reading pane. It shows how a message looks with a greeting, a paragraph and a sign-off.\n\nBest,\n" +
        name,
      date: new Date(base - index * 5 * 3600 * 1000).toISOString(),
      unread: folder === "inbox" && index % 3 === 0,
      starred: index % 6 === 1,
      labels: index % 4 === 0 ? [LABELS[index % LABELS.length]!] : [],
      attachments: index % 5 === 0 ? ["proposal.pdf"] : [],
    };
  });
}

function store(): MailMessage[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as MailMessage[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

function counts(): Record<MailFolder, number> {
  const messages = store();
  return FOLDERS.reduce(
    (acc, folder) => {
      acc[folder] = messages.filter(
        (message) => message.folder === folder && message.unread,
      ).length;
      return acc;
    },
    {} as Record<MailFolder, number>,
  );
}

export function listMail(folder: MailFolder, q?: string): MailListPayload {
  devDebug("[mock:email] list", { folder, q });
  let messages = store().filter((message) => message.folder === folder);
  const query = q?.toLowerCase().trim();
  if (query)
    messages = messages.filter(
      (message) =>
        message.subject.toLowerCase().includes(query) ||
        message.from_name.toLowerCase().includes(query),
    );
  return { messages: structuredClone(messages), counts: counts() };
}

export function getMail(id: number): MailMessage {
  devDebug("[mock:email] get", id);
  const message = store().find((entry) => entry.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  return structuredClone(message);
}

export function sendMail(payload: MailSendPayload): MailMessage {
  devDebug("[mock:email] send", payload);
  if (!payload.to?.trim())
    throw new ValidationError("Validation failed", { to: "required" });
  const messages = store();
  const created: MailMessage = {
    id: Math.max(0, ...messages.map((entry) => entry.id)) + 1,
    folder: "sent",
    from_name: "Me",
    from_email: "me@airglass.example",
    to: payload.to,
    subject: payload.subject || "(no subject)",
    preview: payload.body.slice(0, 80),
    body: payload.body,
    date: new Date().toISOString(),
    unread: false,
    starred: false,
    labels: [],
    attachments: [],
  };
  messages.unshift(created);
  persist();
  return structuredClone(created);
}

export function starMail(id: number): MailMessage {
  devDebug("[mock:email] star", id);
  const message = store().find((entry) => entry.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  message.starred = !message.starred;
  persist();
  return structuredClone(message);
}

export function markMailRead(id: number): MailMessage {
  devDebug("[mock:email] markRead", id);
  const message = store().find((entry) => entry.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  message.unread = false;
  persist();
  return structuredClone(message);
}

export function moveMail(id: number, folder: MailFolder): MailMessage {
  devDebug("[mock:email] move", { id, folder });
  const message = store().find((entry) => entry.id === id);
  if (!message) throw new ApiError(404, "Message not found");
  message.folder = folder;
  persist();
  return structuredClone(message);
}
