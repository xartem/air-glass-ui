/*
 * Typed Admin API client (E2 §6). Screens never call fetch directly — they use
 * the endpoint functions from `@/api`. Cross-cutting behavior lives here:
 *   401 mid-session → re-login modal (request is parked and retried, E2 §5)
 *   403             → surfaced as ApiError for the global toast handler
 *   422             → ValidationError with per-field messages for setError
 *   409             → ConflictError (optimistic-lock dialog, E4 §1)
 * CSRF: X-CSRF-Token header from the XSRF-TOKEN cookie on every mutation (B7 §2).
 *
 * When VITE_API_REAL is not set in dev, requests are served by the in-memory
 * mock layer (`./mock`) — screens cannot tell the difference by design.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends ApiError {
  readonly fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string>) {
    super(422, message);
    this.fields = fields;
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message);
  }
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ?? "/console/api";

const useMock = import.meta.env.DEV && !import.meta.env.VITE_API_REAL;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/* ---- re-login coordination (E2 §5: 401 mid-work never redirects) ---- */

type ReloginListener = () => void;
const reloginListeners = new Set<ReloginListener>();
let reloginWaiters: Array<() => void> = [];

/** Subscribed by the AuthProvider to open the re-login dialog. */
export function onReloginRequired(listener: ReloginListener): () => void {
  reloginListeners.add(listener);
  return () => reloginListeners.delete(listener);
}

/** Called by the re-login dialog after a successful login: parked requests resume. */
export function resumeAfterRelogin(): void {
  const waiters = reloginWaiters;
  reloginWaiters = [];
  waiters.forEach((resume) => resume());
}

function parkUntilRelogin(): Promise<void> {
  const shouldOpenDialog = reloginWaiters.length === 0;
  const parked = new Promise<void>((resolve) => reloginWaiters.push(resolve));
  if (shouldOpenDialog) reloginListeners.forEach((listener) => listener());
  return parked;
}

/* ---- core request ---- */

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Guest endpoints (login/forgot/reset): a 401 is a result, not a session loss. */
  guest?: boolean;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: {
    message?: string;
    code?: string;
    fields?: Record<string, string>;
  } = {};
  try {
    payload = await response.json();
  } catch {
    /* non-JSON error body */
  }
  const message = payload.message ?? response.statusText;
  if (response.status === 422)
    return new ValidationError(message, payload.fields ?? {});
  if (response.status === 409) return new ConflictError(message);
  return new ApiError(response.status, message, payload.code);
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (useMock) {
    const { handleMockRequest } = await import("./mock");
    try {
      return await handleMockRequest<T>(path, options);
    } catch (cause) {
      // The mock must exercise the same 401 → re-login → retry path as fetch
      if (cause instanceof ApiError && cause.status === 401 && !options.guest) {
        await parkUntilRelogin();
        return apiFetch<T>(path, options);
      }
      throw cause;
    }
  }

  const method = options.method ?? "GET";
  const url = new URL(API_BASE + path, window.location.origin);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== "")
      url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET")
    headers["X-CSRF-Token"] = readCookie("XSRF-TOKEN") ?? "";

  const response = await fetch(url, {
    method,
    headers,
    credentials: "same-origin",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options.guest) {
    await parkUntilRelogin();
    return apiFetch<T>(path, options);
  }
  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/* ---- SSE-over-POST (D:ai §5: the agent reply streams on the message POST) ---- */

export interface StreamOptions {
  body?: unknown;
  /** Typed at the endpoint level (api.ai.*); events arrive already JSON-parsed. */
  onEvent: (event: unknown) => void;
  signal?: AbortSignal;
}

export async function apiStream(
  path: string,
  { body, onEvent, signal }: StreamOptions,
): Promise<void> {
  if (useMock) {
    const { handleMockStream } = await import("./mock");
    return handleMockStream(path, body, onEvent, signal);
  }

  const response = await fetch(
    new URL(API_BASE + path, window.location.origin),
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        "X-CSRF-Token": readCookie("XSRF-TOKEN") ?? "",
      },
      credentials: "same-origin",
      body: JSON.stringify(body ?? {}),
      signal,
    },
  );
  if (!response.ok || !response.body) throw await parseError(response);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let boundary: number;
    while ((boundary = buffer.indexOf("\n\n")) !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data:")) onEvent(JSON.parse(line.slice(5)));
      }
    }
  }
}
