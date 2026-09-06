import { AuthForm } from './AuthForm'

/**
 * The failures /auth/callback can actually redirect here with.
 * Anything unrecognised falls back to the generic confirmation message.
 */
const CALLBACK_ERRORS: Record<string, string> = {
  link_expired: 'That link is no longer valid — email links expire, and each one works once. Sign in below, or send yourself a new one.',
  confirmation_failed: 'We couldn’t confirm that link. Sign in below, or request a new one.',
}

function callbackMessage(error: string | string[] | undefined): string | null {
  if (typeof error !== 'string') return null
  return CALLBACK_ERRORS[error] ?? CALLBACK_ERRORS.confirmation_failed
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const notice = callbackMessage((await searchParams).error)

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-end pb-0">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center pb-8">
        <div className="text-center mb-3">
          <p className="font-serif text-[13px] tracking-[0.22em] uppercase font-bold text-white">TOP</p>
          <div className="h-px w-20 bg-white/20 my-1 mx-auto" />
          <p className="font-serif text-[13px] tracking-[0.22em] uppercase font-bold text-white">NOTE</p>
        </div>
        <p className="text-[11px] tracking-[2px] uppercase text-white/40 mt-2">Find your note.</p>
      </div>
      {/* Auth sheet */}
      <div className="w-full max-w-[480px] bg-[#F7F3EE] rounded-t-[32px] px-7 pt-8 pb-12">
        {notice && (
          <div className="mb-6 rounded-2xl border border-black/[0.06] bg-white/60 px-4 py-3.5">
            <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Sign-in link</p>
            <p className="text-sm text-stone-600 leading-relaxed">{notice}</p>
          </div>
        )}
        <AuthForm initialMode={notice ? 'signin' : 'signup'} />
      </div>
    </div>
  )
}
