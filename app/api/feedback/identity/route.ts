import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createClient } from '@/lib/supabase/server'

// GET /api/feedback/identity
// Returns a short-lived (1h) HS256 JWT carrying the Supabase user's identity
// so the Obvious Feedback SDK can submit verified feedback.
// Falls back gracefully — callers should treat non-200 as "proceed unverified".
export async function GET() {
  // Auth guard — 401 tells the client widget to initialize without a token
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new NextResponse(null, { status: 401 })
  }

  const publicKey = process.env.NEXT_PUBLIC_OBVIOUS_FEEDBACK_PUBLIC_KEY
  const secretKey = process.env.OBVIOUS_FEEDBACK_SECRET_KEY

  // Keys not configured yet — return 204 so the client falls back to unverified
  if (!publicKey || !secretKey) {
    return new NextResponse(null, { status: 204 })
  }

  const token = await new SignJWT({
    identity: {
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email,
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(publicKey)
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(secretKey))

  return NextResponse.json({ token })
}

