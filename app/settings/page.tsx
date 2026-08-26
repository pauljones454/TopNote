import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { AvatarUploader } from '@/components/settings/AvatarUploader'
import { isDerivedDisplayName } from '@/lib/profile/validation'
import type { Profile } from '@/lib/supabase/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, handle, display_name, avatar_url, bio')
    .eq('id', user.id)
    .maybeSingle<Pick<Profile, 'id' | 'handle' | 'display_name' | 'avatar_url' | 'bio'>>()

  if (error) {
    console.error('[settings] profile load failed for user', user.id, error)
  }

  const heading = (
    <div className="mb-8">
      <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">App</p>
      <h1 className="font-serif text-3xl text-stone-900">Settings</h1>
    </div>
  )

  // The profile row is created at signup. If it is missing or unreadable, say so rather than
  // rendering a form whose save would fail.
  if (!profile) {
    return (
      <AppShell>
        <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6">
          {heading}
          <div
            className="rounded-2xl bg-white/60 px-6 py-8 text-center"
            style={{
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
            }}
          >
            <h2 className="font-serif text-lg text-stone-900 mb-1.5">We couldn&apos;t load your profile</h2>
            <p className="text-sm text-stone-400 leading-relaxed">
              Reload the page, or{' '}
              <Link href="/auth" className="text-stone-700 underline underline-offset-2">
                sign in again
              </Link>
              {' '}if this keeps happening.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const nameIsPlaceholder = isDerivedDisplayName(profile.display_name ?? '', user.email)

  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6">
        {heading}

        <div className="space-y-4">
          <SettingsSection
            eyebrow="Profile"
            title="Your photo"
            description="Shown on your profile and on every review you write."
          >
            <AvatarUploader
              initialAvatarUrl={profile.avatar_url}
              displayName={profile.display_name ?? profile.handle}
            />
          </SettingsSection>

          <SettingsSection
            eyebrow="Profile"
            title="Your details"
            description={
              nameIsPlaceholder
                ? 'Your name came from your email address at signup — set the one you actually go by.'
                : 'How you appear across Top Note.'
            }
          >
            <ProfileForm
              initialValues={{
                display_name: nameIsPlaceholder ? '' : (profile.display_name ?? ''),
                handle: profile.handle ?? '',
                bio: profile.bio ?? '',
              }}
            />
          </SettingsSection>
        </div>
      </div>
    </AppShell>
  )
}
