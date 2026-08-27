import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const USERS: Record<string, string> = {
  jaozincosta: 'a4148a02cdf1d9e06008a00a86e6626bd6509dc50fda3476e0b9827300df288f',
  mandyy:      'd3cc6dc644453fd5f83ae6f28da55d0f4e59523292ef7948c365b01052b1012a',
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
  const expected = USERS[u]
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
    const expected = USERS[username]
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
