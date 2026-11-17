// Server-side only: imported by route handlers, never by client components.
import { createHmac, pbkdf2Sync, timingSafeEqual } from 'node:crypto'

// Password hashes live only in env vars (PBKDF2-SHA256, 200k iterations).
// Generate a new one with: node scripts/hash-password.mjs <password>
const SALT = 'meu-dashboard-v1-salt-2026'
const ITERATIONS = 200_000

const USER_ENV: Record<string, string> = {
  jaozincosta: 'USER_HASH_JAOZINCOSTA',
  mandyy: 'USER_HASH_MANDYY',
}

function getUserHash(username: string): string | null {
  const envName = USER_ENV[username]
  if (!envName) return null
  const hash = process.env[envName]
  return hash && /^[0-9a-f]{64}$/.test(hash) ? hash : null
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  return ba.length === bb.length && timingSafeEqual(ba, bb)
}

export function normalizeUsername(username: unknown): string {
  return typeof username === 'string' ? username.trim().toLowerCase() : ''
}

export function verifyPassword(username: string, password: string): boolean {
  const expected = getUserHash(username)
  if (!expected || !password) return false
  const hash = pbkdf2Sync(password, SALT, ITERATIONS, 32, 'sha256').toString('hex')
  return safeEqualHex(hash, expected)
}

// Session token = HMAC(password hash, username). The hash never leaves the
// server, so the token can't be forged, and changing the password revokes it.
export function makeToken(username: string): string | null {
  const hash = getUserHash(username)
  if (!hash) return null
  return createHmac('sha256', hash).update(`session-v2:${username}`).digest('hex')
}

export function verifyToken(username: string, token: string): boolean {
  const expected = makeToken(username)
  return !!expected && !!token && safeEqualHex(token, expected)
}

/** Reads `Authorization: Bearer <username>:<token>`; returns the username or null. */
export function authenticate(req: Request): string | null {
  const header = req.headers.get('authorization') ?? ''
  const match = /^Bearer ([^:\s]+):([0-9a-f]{64})$/.exec(header)
  if (!match) return null
  const username = normalizeUsername(match[1])
  return verifyToken(username, match[2]) ? username : null
}
