import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

function getUsers(): Record<string, string> {
  return {
    jaozincosta: process.env.USER_HASH_JAOZINCOSTA ?? '',
    mandyy:      process.env.USER_HASH_MANDYY ?? '',
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function getRedis() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') ?? ''
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const expected = getUsers()[u]
  if (!expected || !timingSafeEqual(token, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const redis = getRedis()
    const data = await redis.get(`data:${u}`)
    return NextResponse.json(data ?? null)
  } catch {
    return NextResponse.json(null)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, token, data } = body
    const expected = getUsers()[username]
    if (!expected || !timingSafeEqual(token ?? '', expected)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const redis = getRedis()
    await redis.set(`data:${username}`, data)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
