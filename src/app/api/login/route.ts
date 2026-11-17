import { NextResponse } from 'next/server'
import { makeToken, normalizeUsername, verifyPassword } from '@/lib/server-auth'

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  const username = normalizeUsername(body.username)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!verifyPassword(username, password)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ username, token: makeToken(username) })
}
