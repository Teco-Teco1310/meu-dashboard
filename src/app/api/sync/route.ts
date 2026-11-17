import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/server-auth'

const LIST_KEYS = ['gastos', 'receitas', 'tarefas', 'todos', 'notas'] as const

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

function isEmptyData(d: Record<string, unknown>): boolean {
  const listsEmpty = LIST_KEYS.every((k) => !Array.isArray(d[k]) || d[k].length === 0)
  const budgets = d.budgets
  const budgetsEmpty = !budgets || typeof budgets !== 'object' || Object.keys(budgets).length === 0
  return listsEmpty && budgetsEmpty
}

export async function GET(req: Request) {
  const username = authenticate(req)
  if (!username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Sync not configured' }, { status: 503 })
  try {
    const data = await redis.get(`data:${username}`)
    return NextResponse.json(data ?? null, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    // Never answer "no data" when we simply couldn't read it: the client
    // would treat that as an empty account and could overwrite real data.
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
}

export async function POST(req: Request) {
  const username = authenticate(req)
  if (!username) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: 'Sync not configured' }, { status: 503 })

  let data: unknown
  try {
    data = (await req.json())?.data
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  if (!data || typeof data !== 'object' || !Array.isArray((data as Record<string, unknown>).gastos)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  try {
    const key = `data:${username}`
    // Safety net: refuse to replace existing data with a completely empty state.
    if (isEmptyData(data as Record<string, unknown>)) {
      const current = await redis.get<Record<string, unknown>>(key)
      if (current && typeof current === 'object' && !isEmptyData(current)) {
        return NextResponse.json({ error: 'Refusing to overwrite data with empty state' }, { status: 409 })
      }
    }
    await redis.set(key, data)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Storage unavailable' }, { status: 503 })
  }
}
