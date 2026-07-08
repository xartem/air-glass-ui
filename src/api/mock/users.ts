import { ApiError, ValidationError, type RequestOptions } from '../client'
import type { Paginated, UserDetail, UserListItem } from '../types'
import { MOCK_USERS, buildUsersFixture, type MockUser, type MockUserKey } from './data'
import { rolesStore } from './roles'

/*
 * Mock of the users module (D:users §3–6). The list dataset persists in
 * localStorage so creates/edits survive reloads; the acting identity comes from
 * `mock.user` (aligned with MOCK_USERS ids 1–3). Invariants that the real
 * backend guards are reproduced here so the E2E checklist (UI:users-roles §5)
 * is exercisable against the mock: no self-deactivation, last active admin is
 * protected, profile is mass-assignment guarded, wrong current password → 422.
 */

const USERS_KEY = 'mock.users'
const PER_PAGE = 15

let cache: MockUser[] | null = null

export function usersStore(): MockUser[] {
  if (cache) return cache
  const raw = localStorage.getItem(USERS_KEY)
  cache = raw ? (JSON.parse(raw) as MockUser[]) : buildUsersFixture()
  persist()
  return cache
}

function persist(): void {
  if (cache) localStorage.setItem(USERS_KEY, JSON.stringify(cache))
}

function currentUserKey(): MockUserKey {
  const stored = localStorage.getItem('mock.user') as MockUserKey | null
  return stored && stored in MOCK_USERS ? stored : 'admin'
}

function currentUserId(): number {
  return MOCK_USERS[currentUserKey()].user.id
}

function adminRoleId(): number {
  return rolesStore().find((role) => role.is_system)?.id ?? 1
}

/** Active users on the admin (system) role — the pool that must never hit zero. */
function activeAdminIds(): number[] {
  const adminId = adminRoleId()
  return usersStore()
    .filter((user) => user.role_id === adminId && user.is_active)
    .map((user) => user.id)
}

function roleHasImpersonate(roleId: number): boolean {
  return rolesStore().find((role) => role.id === roleId)?.permissions.includes('users.impersonate') ?? false
}

function toListItem(user: MockUser): UserListItem {
  const role = rolesStore().find((candidate) => candidate.id === user.role_id)
  const isSelf = user.id === currentUserId()
  const admins = activeAdminIds()
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: { key: role?.key ?? 'unknown', label: role?.label ?? '—' },
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    impersonatable: !isSelf && user.is_active && !roleHasImpersonate(user.role_id),
    is_self: isSelf,
    is_last_admin: admins.length === 1 && admins[0] === user.id,
  }
}

function toDetail(user: MockUser): UserDetail {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role_id: user.role_id,
    ui_locale: user.ui_locale,
    is_active: user.is_active,
    is_self: user.id === currentUserId(),
    mfa_enabled: mfaEnabled(user.id),
  }
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function assertEmailFree(email: string, exceptId?: number): void {
  const taken = usersStore().some(
    (user) => user.email.toLowerCase() === email.toLowerCase() && user.id !== exceptId,
  )
  if (taken) throw new ValidationError('Validation failed', { email: 'email_taken' })
}

export function listUsers(options: RequestOptions): Paginated<UserListItem> {
  const query = options.query ?? {}
  let rows = usersStore().map(toListItem)
  const q = String(query.q ?? '').toLowerCase().trim()
  if (q) rows = rows.filter((row) => row.name.toLowerCase().includes(q) || row.email.toLowerCase().includes(q))
  if (query.role) rows = rows.filter((row) => row.role.key === query.role)
  if (query.active === 'active') rows = rows.filter((row) => row.is_active)
  if (query.active === 'inactive') rows = rows.filter((row) => !row.is_active)
  // Sortable: name / role / last_login; default — most-recent login first,
  // nulls last (UI:users-roles §2).
  const sort = String(query.sort ?? 'last_login')
  const dir = query.dir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name) * dir
    if (sort === 'role') return a.role.label.localeCompare(b.role.label) * dir
    return (a.last_login_at ?? '').localeCompare(b.last_login_at ?? '') * dir
  })
  const page = Number(query.page ?? 1)
  return { rows: rows.slice((page - 1) * PER_PAGE, page * PER_PAGE), total: rows.length, page, per_page: PER_PAGE }
}

export function getUser(id: number): UserDetail {
  const user = usersStore().find((candidate) => candidate.id === id)
  if (!user) throw new ApiError(404, 'User not found')
  return toDetail(user)
}

export function createUser(body: Partial<MockUser> & { password?: string }): UserDetail {
  const fields: Record<string, string> = {}
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  if (!name) fields.name = 'required'
  if (!email) fields.email = 'required'
  else if (!validEmail(email)) fields.email = 'invalid_email'
  if (!body.role_id) fields.role_id = 'required'
  if (!body.password || String(body.password).length < 8) fields.password = 'password_too_short'
  if (Object.keys(fields).length > 0) throw new ValidationError('Validation failed', fields)
  assertEmailFree(email)

  const store = usersStore()
  const id = Math.max(0, ...store.map((user) => user.id)) + 1
  const user: MockUser = {
    id,
    name,
    email,
    role_id: Number(body.role_id),
    ui_locale: String(body.ui_locale ?? 'ru'),
    is_active: body.is_active ?? true,
    last_login_at: null,
  }
  store.push(user)
  persist()
  return toDetail(user)
}

export function updateUser(id: number, body: Partial<MockUser> & { password?: string }): UserDetail {
  const user = usersStore().find((candidate) => candidate.id === id)
  if (!user) throw new ApiError(404, 'User not found')

  const fields: Record<string, string> = {}
  const email = body.email !== undefined ? String(body.email).trim() : user.email
  if (body.email !== undefined) {
    if (!validEmail(email)) fields.email = 'invalid_email'
    else assertEmailFree(email, id)
  }
  if (body.name !== undefined && !String(body.name).trim()) fields.name = 'required'
  if (Object.keys(fields).length > 0) throw new ValidationError('Validation failed', fields)

  const isSelf = id === currentUserId()
  const demotingRole = body.role_id !== undefined && Number(body.role_id) !== user.role_id
  const deactivating = body.is_active === false
  // Self cannot change own role/active (D:users §4); enforced despite the UI locking them.
  if (isSelf && (demotingRole || deactivating)) throw new ValidationError('Validation failed', { role_id: 'self_locked' })
  // Last active admin cannot be demoted off the admin role or deactivated.
  const admins = activeAdminIds()
  const wasSoleAdmin = user.role_id === adminRoleId() && user.is_active && admins.length === 1 && admins[0] === id
  if (wasSoleAdmin && ((demotingRole && Number(body.role_id) !== adminRoleId()) || deactivating)) {
    throw new ValidationError('Validation failed', { role_id: 'last_admin' })
  }

  if (body.name !== undefined) user.name = String(body.name).trim()
  if (body.email !== undefined) user.email = email
  if (body.role_id !== undefined) user.role_id = Number(body.role_id)
  if (body.ui_locale !== undefined) user.ui_locale = String(body.ui_locale)
  if (body.is_active !== undefined) user.is_active = Boolean(body.is_active)
  // A password change revokes the target's remember-tokens/sessions (D:users §4);
  // the mock has no session store to clear, so this is a no-op beyond acceptance.
  persist()
  return toDetail(user)
}

export function setUserActive(id: number, active: boolean): { ok: true } {
  const user = usersStore().find((candidate) => candidate.id === id)
  if (!user) throw new ApiError(404, 'User not found')
  if (!active) {
    if (id === currentUserId()) throw new ValidationError('Validation failed', { _error: 'self_deactivate' })
    const admins = activeAdminIds()
    if (admins.length === 1 && admins[0] === id) throw new ValidationError('Validation failed', { _error: 'last_admin' })
  }
  user.is_active = active
  persist()
  return { ok: true }
}

/*
 * 2FA state (D:auth §3, §6) — separate store so older persisted user fixtures
 * stay valid. The mock accepts TOTP code '123456'; recovery codes are one-time.
 */

const MFA_KEY = 'mock.mfa'
const MOCK_TOTP = '123456'

interface MfaState {
  enabled: boolean
  pending?: boolean
  recovery: string[]
}

function mfaStore(): Record<string, MfaState> {
  try {
    return JSON.parse(localStorage.getItem(MFA_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function persistMfa(store: Record<string, MfaState>): void {
  localStorage.setItem(MFA_KEY, JSON.stringify(store))
}

function makeRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () =>
    `${Math.random().toString(36).slice(2, 7)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase(),
  )
}

export function mfaEnabled(userId: number): boolean {
  return mfaStore()[String(userId)]?.enabled === true
}

export function mfaBeginEnroll(userId: number, email: string): { secret: string; otpauth_uri: string } {
  const store = mfaStore()
  store[String(userId)] = { enabled: false, pending: true, recovery: [] }
  persistMfa(store)
  const secret = 'JBSWY3DPEHPK3PXP' // fixed demo secret; scanning it works in any TOTP app
  return {
    secret,
    otpauth_uri: `otpauth://totp/Universal%20CMS:${encodeURIComponent(email)}?secret=${secret}&issuer=Universal%20CMS`,
  }
}

export function mfaConfirmEnroll(userId: number, code: string): { recovery_codes: string[] } {
  const store = mfaStore()
  const state = store[String(userId)]
  if (!state?.pending) throw new ApiError(409, 'Enroll not started')
  if (code !== MOCK_TOTP) throw new ValidationError('Validation failed', { code: 'invalid_code' })
  const codes = makeRecoveryCodes()
  store[String(userId)] = { enabled: true, recovery: codes }
  persistMfa(store)
  return { recovery_codes: codes }
}

/** TOTP or a one-time recovery code; a used recovery code is burned (D:auth §4). */
export function mfaVerify(userId: number, code: string): boolean {
  if (code === MOCK_TOTP) return true
  const store = mfaStore()
  const state = store[String(userId)]
  const index = state?.recovery.indexOf(code.trim().toUpperCase()) ?? -1
  if (!state || index < 0) return false
  state.recovery.splice(index, 1)
  persistMfa(store)
  return true
}

export function mfaDisable(userId: number, code: string): { ok: true } {
  if (!mfaVerify(userId, code)) throw new ValidationError('Validation failed', { code: 'invalid_code' })
  const store = mfaStore()
  delete store[String(userId)]
  persistMfa(store)
  return { ok: true }
}

export function mfaRegenerateCodes(userId: number): { recovery_codes: string[] } {
  const store = mfaStore()
  const state = store[String(userId)]
  if (!state?.enabled) throw new ApiError(409, '2FA is not enabled')
  state.recovery = makeRecoveryCodes()
  persistMfa(store)
  return { recovery_codes: state.recovery }
}

/** Admin reset of a lost device (users.manage) — drops secret + codes (D:auth §6). */
export function mfaReset(targetId: number): { ok: true } {
  const store = mfaStore()
  delete store[String(targetId)]
  persistMfa(store)
  return { ok: true }
}

export function updateProfile(body: Record<string, unknown>): { ok: true } {
  // Mass-assignment guard (D:users §4): only name + ui_locale are writable here.
  const user = usersStore().find((candidate) => candidate.id === currentUserId())
  const key = currentUserKey()
  if (typeof body.name === 'string' && body.name.trim()) {
    if (user) user.name = body.name.trim()
    MOCK_USERS[key].user.name = body.name.trim()
  }
  if (typeof body.ui_locale === 'string') {
    if (user) user.ui_locale = body.ui_locale
    MOCK_USERS[key].user.ui_locale = body.ui_locale
  }
  persist()
  return { ok: true }
}

export function changeProfilePassword(body: Record<string, unknown>): { ok: true } {
  // Known mock password for every seeded identity is "password" (see MOCK_CREDENTIALS).
  if (body.current_password !== 'password') {
    throw new ValidationError('Validation failed', { current_password: 'wrong_password' })
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    throw new ValidationError('Validation failed', { password: 'password_too_short' })
  }
  return { ok: true }
}
