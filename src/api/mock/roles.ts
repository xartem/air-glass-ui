import { ApiError, ValidationError } from '../client'
import type { CreateRolePayload, Permission, RoleDetail } from '../types'
import { ROLE_SEED, permissionCatalogue, type MockRole } from './data'
import { usersStore } from './users'

/*
 * Mock of the roles/RBAC store (D:users §3–4). Roles persist in localStorage so
 * matrix edits survive reloads. The admin (is_system) role keeps all permissions
 * and cannot be deleted or edited; roles that still have users cannot be deleted.
 */

const ROLES_KEY = 'mock.roles'
const SLUG = /^[a-z][a-z0-9_]*$/

let cache: MockRole[] | null = null

export function rolesStore(): MockRole[] {
  if (cache) return cache
  const raw = localStorage.getItem(ROLES_KEY)
  cache = raw ? (JSON.parse(raw) as MockRole[]) : structuredClone(ROLE_SEED)
  persist()
  return cache
}

function persist(): void {
  if (cache) localStorage.setItem(ROLES_KEY, JSON.stringify(cache))
}

function usersOnRole(roleId: number): number {
  return usersStore().filter((user) => user.role_id === roleId).length
}

function toDetail(role: MockRole): RoleDetail {
  return {
    id: role.id,
    key: role.key,
    label: role.label,
    is_system: role.is_system,
    users_count: usersOnRole(role.id),
    permissions: role.permissions,
  }
}

export function listRoles(): RoleDetail[] {
  return rolesStore().map(toDetail)
}

export function listPermissions(): Permission[] {
  return permissionCatalogue()
}

export function createRole(body: CreateRolePayload): RoleDetail {
  const fields: Record<string, string> = {}
  const key = String(body.key ?? '').trim()
  const label = String(body.label ?? '').trim()
  if (!key) fields.key = 'required'
  else if (!SLUG.test(key)) fields.key = 'invalid_slug'
  else if (rolesStore().some((role) => role.key === key)) fields.key = 'key_taken'
  if (!label) fields.label = 'required'
  if (Object.keys(fields).length > 0) throw new ValidationError('Validation failed', fields)

  const store = rolesStore()
  const source = body.copy_from_id ? store.find((role) => role.id === body.copy_from_id) : undefined
  const role: MockRole = {
    id: Math.max(0, ...store.map((candidate) => candidate.id)) + 1,
    key,
    label,
    is_system: false,
    permissions: source ? [...source.permissions] : [],
  }
  store.push(role)
  persist()
  return toDetail(role)
}

export function renameRole(id: number, label: string): { ok: true } {
  const role = rolesStore().find((candidate) => candidate.id === id)
  if (!role) throw new ApiError(404, 'Role not found')
  const trimmed = String(label ?? '').trim()
  if (!trimmed) throw new ValidationError('Validation failed', { label: 'required' })
  role.label = trimmed
  persist()
  return { ok: true }
}

export function deleteRole(id: number): { ok: true } {
  const store = rolesStore()
  const role = store.find((candidate) => candidate.id === id)
  if (!role) throw new ApiError(404, 'Role not found')
  if (role.is_system) throw new ApiError(422, 'role_is_system', 'role_is_system')
  if (usersOnRole(id) > 0) throw new ApiError(422, 'role_has_users', 'role_has_users')
  cache = store.filter((candidate) => candidate.id !== id)
  persist()
  return { ok: true }
}

export function saveRolePermissions(id: number, keys: string[]): { ok: true } {
  const role = rolesStore().find((candidate) => candidate.id === id)
  if (!role) throw new ApiError(404, 'Role not found')
  // The admin role is all-permissions and read-only (D:users §3) — ignore edits.
  if (!role.is_system) role.permissions = [...new Set(keys)]
  persist()
  return { ok: true }
}
