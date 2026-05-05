'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart, User, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/',           icon: Home,   label: 'Home' },
  { href: '/discover',   icon: Search, label: 'Discover' },
  { href: '/collection', icon: Heart,  label: 'Collection' },
  { href: '/daily',      icon: Flame,  label: 'Daily' },
  { href: '/profile',    icon: User,   label: 'Profile' },
]

export function Sidebar() {
  const path = usePathname()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-[#F0EBE4] border-r border-stone-200 z-40">
        {/* Logo */}
        <div className="h-[72px] flex items-center px-6 border-b border-stone-200 flex-shrink-0">
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-[11px] tracking-[0.22em] uppercase font-bold text-stone-900">TOP</span>
            <div className="h-px w-full bg-stone-300 my-0.5" />
            <span className="font-serif text-[11px] tracking-[0.22em] uppercase font-bold text-stone-900">NOTE</span>
          </Link>
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-6 py-3.5 text-[13px] font-medium transition-colors border-r-[3px]',
                path === href
                  ? 'text-stone-900 bg-stone-900/[0.06] border-stone-900'
                  : 'text-stone-400 border-transparent hover:text-stone-700 hover:bg-stone-900/[0.03]'
              )}
            >
              <Icon size={18} strokeWidth={path === href ? 2 : 1.5} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#F7F3EE]/95 backdrop-blur border-t border-stone-200 z-40 flex">
        {nav.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors',
              path === href ? 'text-stone-900' : 'text-stone-400'
            )}
          >
            <Icon size={20} strokeWidth={path === href ? 2 : 1.5} />
            {label}
            {path === href && <div className="w-1 h-1 rounded-full bg-stone-900" />}
          </Link>
        ))}
      </nav>
    </>
  )
}
