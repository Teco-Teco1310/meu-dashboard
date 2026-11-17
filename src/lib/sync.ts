import { getUsername, getToken } from './auth'

export type FetchResult =
  | { ok: true; data: Record<string, unknown> | null }
  | { ok: false; unauthorized: boolean }

function authHeader(): string | null {
  const u = getUsername()
  const token = getToken()
  return u && token ? `Bearer ${u}:${token}` : null
}

export async function fetchServerData(): Promise<FetchResult> {
  const auth = authHeader()
  if (!auth) return { ok: false, unauthorized: true }
  try {
    const res = await fetch('/api/sync', { headers: { Authorization: auth }, cache: 'no-store' })
    if (!res.ok) return { ok: false, unauthorized: res.status === 401 }
    const data = await res.json()
    return { ok: true, data: data && typeof data === 'object' ? data : null }
  } catch {
    return { ok: false, unauthorized: false }
  }
}

export async function pushServerData(data: Record<string, unknown>): Promise<boolean> {
  const auth = authHeader()
  if (!auth) return false
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ data }),
    })
    return res.ok
  } catch {
    return false
  }
}
