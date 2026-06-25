import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { CreateTaskCard } from '@/components/settings/CreateTaskCard'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6">
        {/* Page heading */}
        <div className="mb-8">
          <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">App</p>
          <h1 className="font-serif text-3xl text-stone-900">Settings</h1>
        </div>

        <div className="space-y-4">
          <div
            className="rounded-2xl bg-white/60 border border-stone-200/60 px-6 py-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <h2 className="font-serif text-lg text-stone-900 mb-1">Account</h2>
            <p className="text-sm text-stone-400 leading-relaxed">Manage your profile details, handle, and email address.</p>
          </div>

          <div
            className="rounded-2xl bg-white/60 border border-stone-200/60 px-6 py-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}
          >
            <h2 className="font-serif text-lg text-stone-900 mb-1">Preferences</h2>
            <p className="text-sm text-stone-400 leading-relaxed">Personalise your experience — display options, notifications, and more.</p>
          </div>

          <CreateTaskCard />
        </div>
      </div>
    </AppShell>
  )
}


