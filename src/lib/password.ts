/*
 * Password generator for the user editor and change-password dialog
 * (UI:users-roles §2–3). 16 chars by default, shown in clear text so the
 * operator can hand it over — there is no email reset channel (D:users §6).
 * Uses crypto.getRandomValues (no Math.random) and an unambiguous alphabet
 * (no 0/O, 1/l/I) to keep hand-transcribed passwords reliable.
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*?'

export function generatePassword(length = 16): string {
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}
