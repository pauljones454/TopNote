import { AppShell } from '@/components/layout/AppShell'

export default function DailyPage() {
  return (
    <AppShell>
      <div className="max-w-[700px] mx-auto px-5 md:px-10 py-6">
        <h1 className="font-serif text-3xl text-stone-900 mb-2">Daily</h1>
        <p className="text-stone-400 text-sm mb-8">Your wear log, challenges, and diary.</p>
        <div className="text-center py-16 text-stone-300">
          <p className="text-4xl mb-3">🔄</p>
          <p className="font-serif text-lg text-stone-400">Coming soon in the next build</p>
        </div>
      </div>
    </AppShell>
  )
}
