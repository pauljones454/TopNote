import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OBVIOUS_BASE = 'https://api.app.obvious.ai/api/v1'
const MAX_INSTRUCTION_LENGTH = 4000
const MAX_NAME_LENGTH = 200

export async function POST(request: NextRequest) {
  // Auth guard — return 401 rather than redirecting (this is an API route)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { instruction, name } = body as Record<string, unknown>

  // Validate instruction
  if (!instruction || typeof instruction !== 'string' || instruction.trim().length === 0) {
    return NextResponse.json({ error: 'instruction is required' }, { status: 400 })
  }
  if (instruction.length > MAX_INSTRUCTION_LENGTH) {
    return NextResponse.json(
      { error: `instruction must be ${MAX_INSTRUCTION_LENGTH} characters or fewer` },
      { status: 400 },
    )
  }

  // Validate optional name
  if (name !== undefined) {
    if (typeof name !== 'string' || name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `name must be a string of ${MAX_NAME_LENGTH} characters or fewer` },
        { status: 400 },
      )
    }
  }

  // Read server-only config — never expose which var is missing or its value
  const apiKey = process.env.OBVIOUS_API_KEY
  const projectId = process.env.OBVIOUS_PROJECT_ID
  if (!apiKey || !projectId) {
    return NextResponse.json({ error: 'Integration not configured' }, { status: 500 })
  }

  const payload: { starterPrompt: string; name?: string } = {
    starterPrompt: instruction.trim(),
    ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
  }

  // Call Obvious External API — retry once on 409 (active execution conflict)
  const callObvious = () =>
    fetch(`${OBVIOUS_BASE}/projects/${encodeURIComponent(projectId)}/thread`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

  let res = await callObvious()

  if (res.status === 409) {
    // Thread already has an active execution — try once more
    res = await callObvious()
  }

  if (!res.ok) {
    const status = res.status
    if (status === 401 || status === 403) {
      // Never surface auth details about the upstream key
      return NextResponse.json({ error: 'Integration not configured' }, { status: 500 })
    }
    if (status === 404) {
      return NextResponse.json({ error: 'Target project not found' }, { status: 502 })
    }
    if (status === 409) {
      return NextResponse.json(
        { error: 'A session is already active — please try again in a moment' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: 'Failed to start Obvious session' }, { status: 502 })
  }

  type ObviousThread = { id: string }
  type ObviousExecution = { id: string; status: string }
  type ObviousResponse = { success: boolean; thread: ObviousThread; execution: ObviousExecution }

  const data = (await res.json()) as ObviousResponse
  return NextResponse.json({ ok: true, threadId: data.thread?.id })
}

