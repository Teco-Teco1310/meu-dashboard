import { getUsername, getToken } from './auth'

export async function fetchServerData(): Promise<Record<string, unknown> | null> {
  const u = getUsername()
  const token = getToken()
  if (!u || !token) return null
  try {
    const res = await fetch(`/api/sync?u=${encodeURIComponent(u)}&token=${encodeURIComponent(token)}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function pushServerData(data: Record<string, unknown>): Promise<void> {
  const username = getUsername()
  const token = getToken()
  if (!username || !token) return
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, token, data }),
    })
  } catch {
    // silently fail — local data is still intact
  }
}
