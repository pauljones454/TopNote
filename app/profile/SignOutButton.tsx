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
    <button onClick={signOut} className="w-full py-3 rounded-xl border border-stone-200 text-sm text-stone-400 hover:text-red-500 hover:border-red-200 transition-colors">
      Sign Out
    </button>
  )
}
