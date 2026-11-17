// Passwords are checked on the server (/api/login). The browser only keeps
// the session token the server hands back — no password hashes in the bundle.
const SESSION_USER_KEY = 'dashboard-user-v2'
const SESSION_TOKEN_KEY = 'dashboard-token-v2'

export async function login(username: string, password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) return false
    const { username: u, token } = await res.json()
    if (!u || !token) return false
    sessionStorage.setItem(SESSION_USER_KEY, u)
    sessionStorage.setItem(SESSION_TOKEN_KEY, token)
    return true
  } catch {
    return false
  }
}

export function isAuthenticated(): boolean {
  return !!getUsername() && !!getToken()
}

export function getUsername(): string {
  try { return sessionStorage.getItem(SESSION_USER_KEY) ?? '' } catch { return '' }
}

export function getToken(): string {
  try { return sessionStorage.getItem(SESSION_TOKEN_KEY) ?? '' } catch { return '' }
}

export function logout(): void {
  try {
    sessionStorage.removeItem(SESSION_USER_KEY)
    sessionStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {}
}
