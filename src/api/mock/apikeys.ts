import { ApiError, ValidationError } from "../client";
import { devDebug } from "../../lib/debug";
import type {
  ApiKey,
  ApiKeyCreatePayload,
  ApiKeyCreated,
  ApiKeyScope,
} from "../types";

/*
 * In-memory mock of the API-key module. Shapes mirror the API DTOs (../types).
 * Only masked keys are persisted; the full secret exists once, in the create
 * response, and is never stored.
 */

const SCOPES: ApiKeyScope[] = ["read", "write", "admin", "billing"];

let cache: ApiKey[] | null = null;
const KEY = "mock.apikeys";

function randomToken(length: number): string {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function mask(secret: string): string {
  return `ag_${secret.slice(3, 7)}…${secret.slice(-4)}`;
}

function build(): ApiKey[] {
  const base = Date.now();
  const names = ["Production server", "Staging deploy", "Zapier integration"];
  return names.map((name, index) => ({
    id: 5000 + index,
    name,
    masked_key: mask(`ag_${randomToken(32)}`),
    scopes: SCOPES.slice(0, (index % SCOPES.length) + 1),
    created_at: new Date(
      base - (index + 1) * 30 * 24 * 3600 * 1000,
    ).toISOString(),
    last_used_at:
      index === 2
        ? null
        : new Date(base - index * 26 * 3600 * 1000).toISOString(),
    status: index === 1 ? "revoked" : "active",
  }));
}

function store(): ApiKey[] {
  if (cache) return cache;
  const raw = localStorage.getItem(KEY);
  cache = raw ? (JSON.parse(raw) as ApiKey[]) : build();
  persist();
  return cache;
}

function persist(): void {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}

export function listApiKeys(): ApiKey[] {
  devDebug("[mock:apikeys] list");
  return structuredClone(store());
}

export function createApiKey(payload: ApiKeyCreatePayload): ApiKeyCreated {
  devDebug("[mock:apikeys] create", payload);
  if (!payload.name?.trim())
    throw new ValidationError("Validation failed", { name: "required" });
  if (!payload.scopes?.length)
    throw new ValidationError("Validation failed", { scopes: "required" });
  const keys = store();
  const secret = `ag_${randomToken(40)}`;
  const created: ApiKey = {
    id: Math.max(0, ...keys.map((entry) => entry.id)) + 1,
    name: payload.name.trim(),
    masked_key: mask(secret),
    scopes: payload.scopes,
    created_at: new Date().toISOString(),
    last_used_at: null,
    status: "active",
  };
  keys.unshift(created);
  persist();
  return { key: structuredClone(created), secret };
}

export function revokeApiKey(id: number): ApiKey {
  devDebug("[mock:apikeys] revoke", id);
  const key = store().find((entry) => entry.id === id);
  if (!key) throw new ApiError(404, "API key not found");
  key.status = "revoked";
  persist();
  return structuredClone(key);
}
