'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="w-full flex items-center justify-between px-5 py-4 text-sm text-stone-400 hover:text-red-400 transition-colors duration-200"
      style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
    >
      <span>Sign Out</span>
    </button>
  )
}
