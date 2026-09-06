import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

const EMAIL_OTP_TYPES: readonly EmailOtpType[] = [
  'signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email',
]

/**
 * The two link shapes GoTrue can send a user here with.
 * `pkce` requires the code verifier stored by the browser that started the flow;
 * `token_hash` carries everything needed in the URL, so it survives the common
 * case of signing up on a laptop and opening the email on a phone.
 */
type Verification =
  | { kind: 'pkce'; code: string }
  | { kind: 'token_hash'; tokenHash: string; type: EmailOtpType }

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  return EMAIL_OTP_TYPES.find((type) => type === value) ?? null
}

function parseVerification(searchParams: URLSearchParams): Verification | null {
  const code = searchParams.get('code')
  if (code) return { kind: 'pkce', code }

  const tokenHash = searchParams.get('token_hash')
  const type = parseEmailOtpType(searchParams.get('type'))
  if (tokenHash && type) return { kind: 'token_hash', tokenHash, type }

  return null
}

/** `next` is attacker-controllable, so only same-origin relative paths are honoured. */
function parseNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

/** GoTrue reports an expired one-time link as `otp_expired`; everything else is opaque. */
function errorParamFor(code: string | null | undefined): 'link_expired' | 'confirmation_failed' {
  return code === 'otp_expired' ? 'link_expired' : 'confirmation_failed'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = parseNextPath(searchParams.get('next'))

  // GoTrue rejects some links before we ever see a token, and redirects here
  // with its own error params (`?error=access_denied&error_code=otp_expired`).
  const providerErrorCode = searchParams.get('error_code')
  if (providerErrorCode) {
    return NextResponse.redirect(`${origin}/auth?error=${errorParamFor(providerErrorCode)}`)
  }

  const verification = parseVerification(searchParams)
  if (!verification) {
    return NextResponse.redirect(`${origin}/auth?error=confirmation_failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = verification.kind === 'pkce'
    ? await supabase.auth.exchangeCodeForSession(verification.code)
    : await supabase.auth.verifyOtp({
        token_hash: verification.tokenHash,
        type: verification.type,
      })

  if (error) {
    return NextResponse.redirect(`${origin}/auth?error=${errorParamFor(error.code)}`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
