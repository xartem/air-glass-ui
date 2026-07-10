import { ApiError } from "../client";
import type {
  AiAttachment,
  AiBlock,
  AiConfirm,
  AiConversationDetail,
  AiConversationListItem,
  AiFinding,
  AiFindingStatus,
  AiMessage,
  AiPlan,
  AiScreenContext,
  AiSpend,
  AiStreamEvent,
  AiToolCall,
  AiTurnUsage,
  AiUsageSummary,
} from "../types";
import { sensitiveSettingIsSet, storedSettingValue } from "./settings";

/*
 * Mock of the ai module (D:ai §4a/§4b/§5): conversations persist in localStorage;
 * the SSE stream is a scripted event sequence with setTimeout delays. Scenarios
 * are keyed by the user text so the UI:ai §7 E2E checklist is exercisable:
 *   plan   → plan_required (approve streams tool rows + actual cost)
 *   delete → confirm_required (yellow card)
 *   blocks/product → rich reply with every block type
 *   limit → soft daily-cap message (no LLM call, usage 0)
 *   anything else → plain streamed text (echoes the screen context when sent)
 */

const STORE_KEY = "mock.aiConversations";
const FINDINGS_KEY = "mock.aiFindings";

const MODEL = "claude-sonnet-4-5";

interface StoredConversation {
  id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: AiMessage[];
}

interface AiStore {
  nextId: number;
  conversations: StoredConversation[];
}

function now(): string {
  return new Date().toISOString();
}

function ago(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

function previewSvg(color: string): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="${color}"/></svg>`,
  )}`;
}

/* ---- store ---- */

function seed(): AiStore {
  const executedPlan: AiPlan = {
    id: 11,
    description: "Create the Oslo Sofa product and rebuild the catalog index.",
    steps: [
      { tool: "catalog.records.create", summary: "Create the product record" },
      { tool: "catalog.reindex", summary: "Rebuild the catalog index" },
    ],
    estimated_cost: 0.02,
    status: "approved",
    actual_cost: 0.03,
  };
  return {
    nextId: 100,
    conversations: [
      {
        id: 1,
        title: "Add the Oslo Sofa product",
        created_at: ago(2 * DAY),
        updated_at: ago(2 * DAY - HOUR),
        messages: [
          {
            id: 21,
            role: "user",
            created_at: ago(2 * DAY),
            parts: [{ kind: "text", text: "Add the Oslo Sofa product" }],
          },
          {
            id: 22,
            role: "assistant",
            created_at: ago(2 * DAY - HOUR),
            parts: [
              {
                kind: "text",
                text: "Checked the draft — everything's ready. Here's the plan:",
              },
              { kind: "plan", plan: executedPlan },
              {
                kind: "tool",
                call: {
                  tool: "catalog.records.create",
                  status: "done",
                  params: { title: "Oslo Sofa" },
                  result: { id: 214 },
                },
              },
              {
                kind: "tool",
                call: {
                  tool: "catalog.reindex",
                  status: "done",
                  params: {},
                  result: { records: 148 },
                },
              },
              {
                kind: "text",
                text: "Done — the product is created and the catalog index is up to date.",
              },
              {
                kind: "block",
                block: {
                  type: "link",
                  label: "Open product",
                  route: "/shop/products/214",
                },
              },
            ],
            usage: { tokens: 1240, cost: 0.03, model: MODEL },
          },
        ],
      },
      {
        id: 2,
        title: "How many orders this week?",
        created_at: ago(5 * HOUR),
        updated_at: ago(5 * HOUR - 60_000),
        messages: [
          {
            id: 31,
            role: "user",
            created_at: ago(5 * HOUR),
            parts: [{ kind: "text", text: "How many orders this week?" }],
          },
          {
            id: 32,
            role: "assistant",
            created_at: ago(5 * HOUR - 60_000),
            parts: [
              {
                kind: "text",
                text: "In the last 7 days you received 18 orders — 12% more than the previous week. Breakdown by channel:",
              },
              {
                kind: "block",
                block: {
                  type: "table",
                  columns: ["Channel", "Orders", "Δ vs last week"],
                  rows: [
                    ["Online store", "9", "+3"],
                    ["Phone", "6", "−1"],
                    ["Marketplace", "3", "+2"],
                  ],
                },
              },
              {
                kind: "block",
                block: {
                  type: "link",
                  label: "Open orders",
                  route: "/shop/orders",
                },
              },
            ],
            usage: { tokens: 380, cost: 0.004, model: MODEL },
          },
        ],
      },
    ],
  };
}

let cache: AiStore | null = null;

function store(): AiStore {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AiStore;
      if (
        Array.isArray(parsed.conversations) &&
        typeof parsed.nextId === "number"
      ) {
        cache = parsed;
        return cache;
      }
    }
  } catch {
    /* corrupted store → re-seed */
  }
  cache = seed();
  persist();
  return cache;
}

function persist(): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(cache));
}

function nextId(): number {
  return store().nextId++;
}

function mustFind(id: number): StoredConversation {
  const conversation = store().conversations.find(
    (candidate) => candidate.id === id,
  );
  if (!conversation) throw new ApiError(404, "Conversation not found");
  return conversation;
}

/** Conversation usage = sum of per-turn usage rows (mirrors UsageMeter::conversationUsage). */
function usageOf(conversation: StoredConversation): AiUsageSummary {
  let tokens = 0;
  let cost = 0;
  const models: string[] = [];
  for (const message of conversation.messages) {
    if (!message.usage) continue;
    tokens += message.usage.tokens;
    cost += message.usage.cost;
    if (message.usage.model && !models.includes(message.usage.model))
      models.push(message.usage.model);
  }
  return { tokens, cost: Math.round(cost * 1000) / 1000, models };
}

/* ---- CRUD ---- */

export function listAiConversations(): AiConversationListItem[] {
  return [...store().conversations]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .map((conversation) => {
      const usage = usageOf(conversation);
      return {
        id: conversation.id,
        title: conversation.title,
        updated_at: conversation.updated_at,
        tokens: usage.tokens,
        cost: usage.cost,
      };
    });
}

export function getAiConversation(id: number): AiConversationDetail {
  const conversation = mustFind(id);
  return {
    id: conversation.id,
    title: conversation.title,
    updated_at: conversation.updated_at,
    usage: usageOf(conversation),
    messages: conversation.messages,
  };
}

export function createAiConversation(): AiConversationDetail {
  const conversation: StoredConversation = {
    id: nextId(),
    title: null,
    created_at: now(),
    updated_at: now(),
    messages: [],
  };
  store().conversations.push(conversation);
  persist();
  return getAiConversation(conversation.id);
}

export function deleteAiConversation(id: number): { ok: true } {
  mustFind(id);
  const s = store();
  s.conversations = s.conversations.filter(
    (conversation) => conversation.id !== id,
  );
  persist();
  return { ok: true };
}

/* ---- streaming machinery ---- */

type Emit = (event: AiStreamEvent) => void;

/** Thrown by tick() when the client pressed "Stop" — partial turn is persisted. */
class MockAbort extends Error {}

async function tick(
  signal: AbortSignal | undefined,
  ms: number,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
  if (signal?.aborted) throw new MockAbort("aborted");
}

async function emitText(
  reply: AiMessage,
  emit: Emit,
  signal: AbortSignal | undefined,
  text: string,
): Promise<void> {
  const chunks = text.match(/\S+\s*/g) ?? [];
  const part = { kind: "text" as const, text: "" };
  reply.parts.push(part);
  for (let index = 0; index < chunks.length; index += 3) {
    await tick(signal, 110);
    const piece = chunks.slice(index, index + 3).join("");
    part.text += piece;
    emit({ type: "delta", text: piece });
  }
}

async function emitBlock(
  reply: AiMessage,
  emit: Emit,
  signal: AbortSignal | undefined,
  block: AiBlock,
): Promise<void> {
  await tick(signal, 320);
  reply.parts.push({ kind: "block", block });
  emit({ type: "block", block });
}

async function emitToolRun(
  reply: AiMessage,
  emit: Emit,
  signal: AbortSignal | undefined,
  tool: string,
  params: Record<string, unknown>,
  result: unknown,
): Promise<void> {
  await tick(signal, 260);
  const call: AiToolCall = { tool, status: "running", params };
  reply.parts.push({ kind: "tool", call });
  emit({ type: "tool_call", tool, params });
  await tick(signal, 520);
  call.status = "done";
  call.result = result;
  emit({ type: "tool_result", tool, status: "done", result });
}

function finishTurn(
  reply: AiMessage,
  emit: Emit,
  usage: AiTurnUsage,
  costLimited = false,
): void {
  reply.usage = usage;
  if (costLimited) reply.cost_limited = true;
  emit(
    costLimited
      ? { type: "done", usage, cost_limited: true }
      : { type: "done", usage },
  );
}

/* ---- scenarios ---- */

interface MessageBody {
  message: string;
  screen_context?: AiScreenContext | null;
  attachments?: AiAttachment[];
}

type Scenario = (
  reply: AiMessage,
  ctx: AiScreenContext | null,
  emit: Emit,
  signal?: AbortSignal,
) => Promise<void>;

/** Generous multi-language triggers so localized example prompts hit their scenario. */
function scenarioFor(text: string): Scenario {
  const q = text.toLowerCase();
  if (/limit|límite|limite/.test(q)) return limitScenario;
  if (/delete|lösch|supprim|elimin|borra|usuń/.test(q)) return deleteScenario;
  if (/plan|pian/.test(q)) return planScenario;
  if (/block|bloc|product|prodot|produ/.test(q)) return blocksScenario;
  return defaultScenario;
}

const defaultScenario: Scenario = async (reply, ctx, emit, signal) => {
  const prefix = ctx ? `I can see the ${ctx.label} screen. ` : "";
  await emitText(
    reply,
    emit,
    signal,
    `${prefix}I'm the assistant for this admin: I can manage products, orders and settings — always within your permissions. Try: "draft a plan for a new product", "show the latest products" or "how many orders this week?".`,
  );
  finishTurn(reply, emit, { tokens: 310, cost: 0.002, model: MODEL });
};

const planScenario: Scenario = async (reply, _ctx, emit, signal) => {
  await emitText(
    reply,
    emit,
    signal,
    "Got it. Before I change anything — here's the plan:",
  );
  await tick(signal, 300);
  const plan: AiPlan = {
    id: nextId(),
    description:
      "Create the Oslo Sofa product: price $1,290, category Furniture, status draft.",
    steps: [
      { tool: "catalog.records.create", summary: "Create the product record" },
      {
        tool: "media.attach",
        summary: "Attach a cover image from the media library",
      },
      { tool: "catalog.records.update", summary: "Set the price and category" },
    ],
    estimated_cost: 0.03,
    status: "pending",
    actual_cost: null,
  };
  reply.parts.push({ kind: "plan", plan });
  emit({ type: "plan_required", plan });
  finishTurn(reply, emit, { tokens: 460, cost: 0.004, model: MODEL });
};

const deleteScenario: Scenario = async (reply, _ctx, emit, signal) => {
  await emitText(
    reply,
    emit,
    signal,
    "Deletion is irreversible, so I need your confirmation:",
  );
  await tick(signal, 280);
  const confirm: AiConfirm = {
    id: nextId(),
    tool: "products.delete",
    params: { id: "12", title: "Oslo Sofa (draft)" },
    status: "pending",
  };
  reply.parts.push({ kind: "confirm", confirm });
  emit({ type: "confirm_required", confirm });
  finishTurn(reply, emit, { tokens: 350, cost: 0.003, model: MODEL });
};

const blocksScenario: Scenario = async (reply, _ctx, emit, signal) => {
  await emitText(reply, emit, signal, "Here are the latest catalog products:");
  await emitBlock(reply, emit, signal, {
    type: "card_list",
    items: [
      {
        entity_type: "record",
        id: 7,
        title: "Wireless Keyboard",
        subtitle: "$1,250 · published",
        preview_url: previewSvg("#bfdbfe"),
        badges: ["in stock"],
        route: "/shop/products/7",
        public_url: "https://demo.example.com/products/wireless-keyboard",
      },
      {
        entity_type: "record",
        id: 9,
        title: "USB-C Hub",
        subtitle: "$890 · draft",
        preview_url: previewSvg("#bbf7d0"),
        badges: ["draft"],
        route: "/shop/products/9",
      },
      // RBAC stub: the presenter refused hydration — no data leaks (D:ai §4a)
      { entity_type: "record", id: 11, stub: "no_access" },
    ],
  });
  await emitText(reply, emit, signal, "Views and orders for the week:");
  await emitBlock(reply, emit, signal, {
    type: "table",
    columns: ["Product", "Views", "Orders"],
    rows: [
      ["Wireless Keyboard", "1,204", "6"],
      ["USB-C Hub", "311", "1"],
      ["Standing Desk", "862", "4"],
    ],
  });
  await emitBlock(reply, emit, signal, {
    type: "image",
    media_id: 4,
    alt: "og-cover.jpg",
    preview_url: previewSvg("#fde68a"),
  });
  await emitBlock(reply, emit, signal, {
    type: "video",
    media_id: 12,
    label: "about-video.mp4",
    poster_url: previewSvg("#ddd6fe"),
  });
  await emitBlock(reply, emit, signal, {
    type: "file",
    media_id: 10,
    label: "Price list",
    name: "price-list.pdf",
    size: 482304,
  });
  await emitBlock(reply, emit, signal, {
    type: "progress",
    job_id: 7,
    label: "Catalog reindex",
    percent: 60,
  });
  await emitBlock(reply, emit, signal, {
    type: "buttons",
    items: [
      {
        label: "All products",
        kind: "route",
        route: "/shop/products",
        style: "primary",
      },
      {
        label: "Storefront catalog",
        kind: "url",
        url: "https://demo.example.com/products",
        style: "secondary",
      },
      {
        label: "API documentation",
        kind: "url",
        url: "https://developers.example.dev/catalog",
        external: true,
        style: "secondary",
      },
      {
        label: "Delete USB-C Hub draft",
        kind: "tool",
        tool: "catalog.records.delete",
        args: { id: 9 },
        style: "danger",
      },
    ],
  });
  await emitBlock(reply, emit, signal, {
    type: "link",
    label: "Supplier price list",
    url: "https://partner-warehouse.example.org/price",
    external: true,
  });
  finishTurn(reply, emit, { tokens: 980, cost: 0.006, model: MODEL });
};

const limitScenario: Scenario = async (reply, _ctx, emit, signal) => {
  // Cap check runs BEFORE the LLM call (UsageMeter::withinLimit) — usage stays 0.
  await emitText(
    reply,
    emit,
    signal,
    "The daily AI spend limit has been reached — let's continue tomorrow. An administrator can change the limit in settings.",
  );
  finishTurn(reply, emit, { tokens: 0, cost: 0, model: MODEL }, true);
};

/* ---- stream endpoints ---- */

export async function streamAiMessage(
  conversationId: number | null,
  body: MessageBody,
  emit: Emit,
  signal?: AbortSignal,
): Promise<void> {
  let conversation: StoredConversation;
  if (conversationId === null) {
    const created = createAiConversation();
    conversation = mustFind(created.id);
    emit({ type: "created", conversation_id: conversation.id });
  } else {
    conversation = mustFind(conversationId);
  }

  const text = String(body.message ?? "").trim();
  // A message may be attachments-only (D:ai §4d) — reject only when both are empty.
  if (!text && !body.attachments?.length)
    throw new ApiError(422, "Empty message");

  // A new message automatically supersedes any pending plan (D:ai §4b)
  for (const message of conversation.messages) {
    for (const part of message.parts) {
      if (part.kind === "plan" && part.plan.status === "pending")
        part.plan.status = "superseded";
    }
  }

  const userMessage: AiMessage = {
    id: nextId(),
    role: "user",
    created_at: now(),
    parts: [{ kind: "text", text }],
    ...(body.attachments?.length ? { attachments: body.attachments } : {}),
  };
  const reply: AiMessage = {
    id: nextId(),
    role: "assistant",
    created_at: now(),
    parts: [],
  };

  try {
    await scenarioFor(text)(reply, body.screen_context ?? null, emit, signal);
  } catch (cause) {
    if (!(cause instanceof MockAbort)) throw cause;
  } finally {
    // Persist at the end so the history refetch never sees a half-written turn
    conversation.messages.push(userMessage, reply);
    conversation.title ??= text.slice(0, 48);
    conversation.updated_at = now();
    persist();
  }
}

function findPlan(planId: number): {
  conversation: StoredConversation;
  message: AiMessage;
  plan: AiPlan;
} | null {
  for (const conversation of store().conversations) {
    for (const message of conversation.messages) {
      for (const part of message.parts) {
        if (part.kind === "plan" && part.plan.id === planId) {
          return { conversation, message, plan: part.plan };
        }
      }
    }
  }
  return null;
}

export async function streamAiPlanApprove(
  planId: number,
  emit: Emit,
  signal?: AbortSignal,
): Promise<void> {
  const found = findPlan(planId);
  if (!found) throw new ApiError(404, "Plan not found");
  // Stale/superseded plan → 409 (D:ai §5)
  if (found.plan.status !== "pending")
    throw new ApiError(409, "Plan is no longer pending");
  found.plan.status = "approved";
  persist();

  const { conversation, message: reply, plan } = found;
  try {
    await emitToolRun(
      reply,
      emit,
      signal,
      "catalog.records.create",
      { title: "Oslo Sofa" },
      { id: 214 },
    );
    await emitToolRun(
      reply,
      emit,
      signal,
      "media.attach",
      { record_id: 214, media: "2026/07/catalog-tile.webp" },
      { ok: true },
    );
    await emitToolRun(
      reply,
      emit,
      signal,
      "catalog.records.update",
      { id: 214, price: 1290, category: "Furniture" },
      { ok: true },
    );
    await emitText(
      reply,
      emit,
      signal,
      "Done: the product was created as a draft. Review the card and publish it when you're ready.",
    );
    await emitBlock(reply, emit, signal, {
      type: "link",
      label: "Open Oslo Sofa",
      route: "/shop/products/214",
    });
    // Actual series cost lands on the card: «≈ $0.03 → $0.04» (D:ai §4b)
    plan.actual_cost = 0.04;
    const usage: AiTurnUsage = { tokens: 1380, cost: 0.04, model: MODEL };
    reply.usage = {
      tokens: (reply.usage?.tokens ?? 0) + usage.tokens,
      cost: Math.round(((reply.usage?.cost ?? 0) + usage.cost) * 1000) / 1000,
      model: MODEL,
    };
    emit({ type: "done", usage });
  } catch (cause) {
    if (!(cause instanceof MockAbort)) throw cause;
  } finally {
    conversation.updated_at = now();
    persist();
  }
}

/* ---- plan reject / confirm / tool buttons ---- */

function appendAssistant(
  conversation: StoredConversation,
  parts: AiMessage["parts"],
  usage?: AiTurnUsage,
): void {
  conversation.messages.push({
    id: nextId(),
    role: "assistant",
    created_at: now(),
    parts,
    usage: usage ?? null,
  });
  conversation.updated_at = now();
  persist();
}

export function rejectAiPlan(planId: number): { ok: true } {
  const found = findPlan(planId);
  if (!found) throw new ApiError(404, "Plan not found");
  if (found.plan.status !== "pending")
    throw new ApiError(409, "Plan is no longer pending");
  found.plan.status = "rejected";
  appendAssistant(found.conversation, [
    { kind: "text", text: "Plan cancelled — I did not run anything." },
  ]);
  return { ok: true };
}

function findConfirm(
  id: number,
): { conversation: StoredConversation; confirm: AiConfirm } | null {
  for (const conversation of store().conversations) {
    for (const message of conversation.messages) {
      for (const part of message.parts) {
        if (part.kind === "confirm" && part.confirm.id === id)
          return { conversation, confirm: part.confirm };
      }
    }
  }
  return null;
}

/** Returns audit info so the route layer can log the AI action (marked "performed by AI"). */
export function confirmAiAction(id: number): {
  ok: true;
  tool: string;
  params: Record<string, string>;
} {
  const found = findConfirm(id);
  if (!found) throw new ApiError(404, "Pending action not found");
  if (found.confirm.status !== "pending")
    throw new ApiError(409, "Action is no longer pending");
  found.confirm.status = "confirmed";
  appendAssistant(
    found.conversation,
    [
      {
        kind: "tool",
        call: {
          tool: found.confirm.tool,
          status: "done",
          params: found.confirm.params,
          result: { ok: true },
        },
      },
      {
        kind: "text",
        text: "Done. The action was recorded in the activity log, marked as AI.",
      },
    ],
    { tokens: 240, cost: 0.002, model: MODEL },
  );
  return { ok: true, tool: found.confirm.tool, params: found.confirm.params };
}

export function cancelAiAction(id: number): { ok: true } {
  const found = findConfirm(id);
  if (!found) throw new ApiError(404, "Pending action not found");
  if (found.confirm.status !== "pending")
    throw new ApiError(409, "Action is no longer pending");
  found.confirm.status = "cancelled";
  appendAssistant(found.conversation, [
    { kind: "text", text: "Cancelled — I did not change anything." },
  ]);
  return { ok: true };
}

/** Suggested-tool button (D:ai §4a kind=tool): destructive raises a confirm card, the rest run. */
export function runAiTool(
  conversationId: number,
  tool: string,
  args: Record<string, unknown>,
): { ok: true } {
  const conversation = mustFind(conversationId);
  const params = Object.fromEntries(
    Object.entries(args ?? {}).map(([key, value]) => [key, String(value)]),
  );
  if (/\.(delete|remove)$/.test(tool)) {
    appendAssistant(conversation, [
      { kind: "text", text: "This is a destructive action — please confirm:" },
      {
        kind: "confirm",
        confirm: { id: nextId(), tool, params, status: "pending" },
      },
    ]);
    return { ok: true };
  }
  appendAssistant(
    conversation,
    [
      {
        kind: "tool",
        call: {
          tool,
          status: "done",
          params: args ?? {},
          result: { ok: true },
        },
      },
      { kind: "text", text: "Done." },
    ],
    { tokens: 180, cost: 0.001, model: MODEL },
  );
  return { ok: true };
}

/* ---- settings extras: test call + spend series ---- */

export function aiTestConnection(): { ok: boolean } {
  const provider = String(storedSettingValue("ai.provider") ?? "claude");
  return { ok: sensitiveSettingIsSet(`ai.api_key.${provider}`) };
}

/** Deterministic day series so the chart is stable across reloads (mirrors mock/dashboard). */
export function aiSpend(): AiSpend {
  const series: AiSpend["series"] = [];
  let state = 13;
  for (let index = 29; index >= 0; index--) {
    state = (state * 1103515245 + 12345) % 2147483648;
    const date = new Date(Date.now() - index * DAY);
    series.push({
      date: `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`,
      cost:
        Math.round(Math.max(0, 0.9 + (state / 2147483648 - 0.5) * 1.4) * 100) /
        100,
    });
  }
  const sum = (points: AiSpend["series"]) =>
    Math.round(points.reduce((total, point) => total + point.cost, 0) * 100) /
    100;
  return {
    today: series[series.length - 1]?.cost ?? 0,
    week: sum(series.slice(-7)),
    month: sum(series),
    series,
  };
}

/* ---- findings (D:ai §4c) ---- */

function seedFindings(): AiFinding[] {
  return [
    {
      id: 1,
      severity: "critical",
      title: "PDOException: database is locked (order checkout)",
      summary:
        "Concurrent writes to SQLite during checkout — likely a long transaction in OrderService holding the lock. Priority: high.",
      sample:
        "[2026-07-03 03:12:44] critical: PDOException SQLSTATE[HY000]: database is locked at modules/orders/Repositories/OrderRepository.php:118",
      context: {
        exception: "PDOException",
        file: "modules/orders/Repositories/OrderRepository.php",
        line: "118",
      },
      count: 14,
      first_seen: ago(3 * DAY),
      last_seen: ago(5 * HOUR),
      status: "new",
      resolved_note: null,
    },
    {
      id: 2,
      severity: "error",
      title: "MailTransportException: SMTP connect timeout",
      summary:
        "The SMTP provider is not responding — emails fall into the retry queue and delivery is delayed.",
      sample:
        "[2026-07-04 01:20:10] error: MailTransportException: connect timeout smtp.example.com:465 at modules/mail/Services/SmtpDriver.php:57",
      context: {
        exception: "MailTransportException",
        file: "modules/mail/Services/SmtpDriver.php",
        line: "57",
      },
      count: 5,
      first_seen: ago(DAY),
      last_seen: ago(6 * HOUR),
      status: "new",
      resolved_note: null,
    },
    {
      id: 3,
      severity: "error",
      title: "MediaResizeException: unsupported image format",
      // summary NULL: the triage collected the group while the LLM key was absent (D:ai §4c step 2)
      summary: null,
      sample:
        "[2026-07-02 14:03:51] error: MediaResizeException: unsupported image format storage/media/2026/07/promo.heic at modules/media/Services/ImageProcessor.php:92",
      context: {
        exception: "MediaResizeException",
        file: "modules/media/Services/ImageProcessor.php",
        line: "92",
      },
      count: 2,
      first_seen: ago(2 * DAY),
      last_seen: ago(2 * DAY - 3 * HOUR),
      status: "acknowledged",
      resolved_note: null,
    },
    {
      id: 4,
      severity: "error",
      title: "RouteNotFound: /old-catalog/*",
      summary:
        "Mass 404s from old catalog URLs — a 301 redirect to the new structure is needed.",
      sample:
        "[2026-06-29 09:41:02] error: RouteNotFound: GET /old-catalog/pumps at core/Router.php:203",
      context: {
        exception: "RouteNotFound",
        file: "core/Router.php",
        line: "203",
      },
      count: 31,
      first_seen: ago(6 * DAY),
      last_seen: ago(4 * DAY),
      status: "resolved",
      resolved_note: "redirect added in v1.4.2",
    },
  ];
}

let findingsCache: AiFinding[] | null = null;

function findings(): AiFinding[] {
  if (findingsCache) return findingsCache;
  try {
    const raw = localStorage.getItem(FINDINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AiFinding[];
      if (Array.isArray(parsed)) {
        findingsCache = parsed;
        return findingsCache;
      }
    }
  } catch {
    /* corrupted store → re-seed */
  }
  findingsCache = seedFindings();
  localStorage.setItem(FINDINGS_KEY, JSON.stringify(findingsCache));
  return findingsCache;
}

export function listAiFindings(): AiFinding[] {
  return [...findings()].sort((a, b) => b.last_seen.localeCompare(a.last_seen));
}

export function setAiFindingStatus(
  id: number,
  status: AiFindingStatus,
  note?: string,
): { ok: true } {
  const finding = findings().find((candidate) => candidate.id === id);
  if (!finding) throw new ApiError(404, "Finding not found");
  if (!["new", "acknowledged", "resolved"].includes(status))
    throw new ApiError(422, "Unknown status");
  finding.status = status;
  if (status === "resolved") finding.resolved_note = note?.trim() || null;
  localStorage.setItem(FINDINGS_KEY, JSON.stringify(findingsCache));
  return { ok: true };
}
