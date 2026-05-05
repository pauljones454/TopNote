'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Mode = 'signin' | 'signup' | 'magic' | 'verify'

export function AuthForm() {
  const [mode, setMode] = useState<Mode>('signup')
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup() {
    setLoading(true); setError('')
    // Check handle
    const { data: existing } = await supabase.from('profiles').select('id').eq('handle', handle).maybeSingle()
    if (existing) { setError('@' + handle + ' is taken'); setLoading(false); return }

    const { data, error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { display_name: name, handle, gender_pref: gender } }
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, handle, display_name: name, bio: gender }, { onConflict: 'id' })
    }
    setMode('verify')
    setLoading(false)
  }

  async function handleSignin() {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/')
    router.refresh()
  }

  async function handleMagic() {
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithOtp({ email })
    if (err) { setError(err.message); setLoading(false); return }
    setMode('verify')
    setLoading(false)
  }

  if (mode === 'verify') return (
    <div className="text-center">
      <div className="text-5xl mb-4">📬</div>
      <h2 className="font-serif text-2xl text-stone-900 mb-2">Check your email</h2>
      <p className="text-sm text-stone-500 mb-6 leading-relaxed">We sent a link to <strong>{email}</strong>. Click it to activate your account.</p>
      <button onClick={() => setMode('signin')} className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold">
        I&apos;ve confirmed — Sign In
      </button>
    </div>
  )

  if (mode === 'signup') {
    if (step === 1) return (
      <div>
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Create Account</p>
        <h2 className="font-serif text-3xl text-stone-900 mb-1">Join Top Note.</h2>
        <p className="text-sm text-stone-400 mb-6">Track your collection, log your wears, rank up.</p>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
          className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-3 outline-none focus:border-stone-400 bg-white" />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password (min 6 chars)"
          className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-4 outline-none focus:border-stone-400 bg-white" />
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button onClick={() => { if (!email || password.length < 6) { setError('Check your email and password'); return } setError(''); setStep(2) }}
          className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold mb-3">Continue →</button>
        <button onClick={() => setMode('signin')} className="w-full py-2.5 text-sm text-stone-400">Already have an account? Sign in</button>
      </div>
    )
    if (step === 2) return (
      <div>
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Step 2 of 3</p>
        <h2 className="font-serif text-3xl text-stone-900 mb-6">Your profile.</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
          className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-3 outline-none focus:border-stone-400 bg-white" />
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">@</span>
          <input value={handle} onChange={e => setHandle(e.target.value.replace(/[^a-z0-9_.]/gi,'').toLowerCase())} placeholder="yourhandle"
            className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-stone-200 text-sm outline-none focus:border-stone-400 bg-white" />
        </div>
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button onClick={() => { if (!name || !handle) { setError('Fill in both fields'); return } setError(''); setStep(3) }}
          className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold">Continue →</button>
      </div>
    )
    return (
      <div>
        <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">Step 3 of 3</p>
        <h2 className="font-serif text-3xl text-stone-900 mb-2">What do you wear?</h2>
        <p className="text-sm text-stone-400 mb-6">Helps us surface the right recommendations.</p>
        <div className="flex gap-3 mb-6">
          {['masculine','feminine','both'].map(g => (
            <button key={g} onClick={() => setGender(g)}
              className={`flex-1 py-3.5 rounded-xl text-sm font-semibold capitalize border transition-all ${
                gender === g ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-500 border-stone-200'
              }`}>{g}</button>
          ))}
        </div>
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
        <button onClick={() => { if (!gender) { setError('Pick a preference'); return } handleSignup() }} disabled={loading}
          className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold disabled:opacity-50">
          {loading ? 'Creating account…' : 'Create Profile →'}
        </button>
      </div>
    )
  }

  if (mode === 'magic') return (
    <div>
      <h2 className="font-serif text-3xl text-stone-900 mb-2">Magic link.</h2>
      <p className="text-sm text-stone-400 mb-6">We&apos;ll email you a one-click sign-in link.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
        className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-4 outline-none focus:border-stone-400 bg-white" />
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <button onClick={handleMagic} disabled={loading}
        className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold mb-3 disabled:opacity-50">
        {loading ? 'Sending…' : 'Send Magic Link →'}
      </button>
      <button onClick={() => setMode('signin')} className="w-full py-2.5 text-sm text-stone-400">← Back to sign in</button>
    </div>
  )

  return (
    <div>
      <h2 className="font-serif text-3xl text-stone-900 mb-2">Welcome back.</h2>
      <p className="text-sm text-stone-400 mb-6">Your collection is waiting.</p>
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="your@email.com"
        className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-3 outline-none focus:border-stone-400 bg-white" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password"
        className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-sm mb-4 outline-none focus:border-stone-400 bg-white" />
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <button onClick={handleSignin} disabled={loading}
        className="w-full py-3.5 rounded-xl bg-stone-900 text-white text-sm font-semibold mb-3 disabled:opacity-50">
        {loading ? 'Signing in…' : 'Sign In →'}
      </button>
      <button onClick={() => setMode('magic')} className="w-full py-2 text-sm text-stone-400">Forgot password? Magic link</button>
      <button onClick={() => { setMode('signup'); setStep(1) }} className="w-full py-2 text-sm text-stone-400">New here? Create an account</button>
    </div>
  )
}
