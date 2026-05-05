import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: items } = await supabase
    .from('collection')
    .select('*, fragrance:fragrances(*)')
    .eq('user_id', user.id)
    .eq('status', 'owned')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-6">
        <h1 className="font-serif text-3xl text-stone-900 mb-6">Your Shelf</h1>
        {!items?.length ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🧴</p>
            <p className="font-serif text-xl text-stone-700 mb-2">Your shelf is empty</p>
            <p className="text-sm text-stone-400 mb-6">Add fragrances you own from the Discover tab</p>
            <Link href="/discover" className="inline-block px-6 py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold">
              Browse fragrances →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0">
            {items.map(item => {
              const f = item.fragrance as any
              if (!f) return null
              return (
                <Link key={item.id} href={`/fragrance/${f.id}`} className="group p-2 block">
                  <div className="w-full aspect-[3/4] relative mb-2">
                    {f.bottle_image_url ? (
                      <Image src={f.bottle_image_url} alt={f.name} fill className="object-contain" sizes="200px" />
                    ) : (
                      <div className="w-full h-full bg-stone-100 rounded-xl flex items-center justify-center">
                        <span className="font-serif text-xl text-stone-400">{f.house.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <p className="font-serif text-[11px] text-stone-800 leading-tight line-clamp-2">{f.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{f.house}</p>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
