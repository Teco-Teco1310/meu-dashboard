// Credentials stored as PBKDF2-SHA256 hashes (200k iterations). No plaintext.
const SALT = 'meu-dashboard-v1-salt-2026'
const ITERATIONS = 200_000
const SESSION_KEY = 'dashboard-session-v1'
const SESSION_USER_KEY = 'dashboard-user-v1'

const USERS: Record<string, string> = {
  jaozincosta: 'a4148a02cdf1d9e06008a00a86e6626bd6509dc50fda3476e0b9827300df288f',
  mandyy:      'd3cc6dc644453fd5f83ae6f28da55d0f4e59523292ef7948c365b01052b1012a',
}

async function deriveHash(password: string): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(SALT), iterations: ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function login(username: string, password: string): Promise<boolean> {
  const u = username.trim().toLowerCase()
  const expectedHash = USERS[u]
  if (!expectedHash) return false
  const hash = await deriveHash(password)
  if (!timingSafeEqual(hash, expectedHash)) return false
  sessionStorage.setItem(SESSION_KEY, '1')
  sessionStorage.setItem(SESSION_USER_KEY, u)
  return true
}

export function isAuthenticated(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === '1' } catch { return false }
}

export function getUsername(): string {
  try { return sessionStorage.getItem(SESSION_USER_KEY) ?? '' } catch { return '' }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_USER_KEY)
}
