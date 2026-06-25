'use client'
import { useState } from 'react'

const SCREENS = [
  { label: 'Home',             href: '/' },
  { label: 'Discover',         href: '/discover' },
  { label: 'Collection',       href: '/collection' },
  { label: 'Layers',           href: '/layers' },
  { label: 'Layer Create',     href: '/layers/create' },
  { label: 'Daily',            href: '/daily' },
  { label: 'Profile',          href: '/profile' },
  { label: 'Auth',             href: '/auth' },
  { label: 'Fragrance Detail', href: '/fragrance/7b3f8c2a-1d4e-4f9b-b6a2-5e8d3c0f2a1b' },
]

// iPhone 15 Pro dimensions: 393 × 852 logical px
const W = 393
const H = 852

export default function StudioPage() {
  const [active, setActive] = useState('/')
  const [scale, setScale]   = useState(0.82)

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a227' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Top Note · Studio
          </span>
        </div>

        {/* Scale control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{Math.round(scale * 100)}%</span>
          {[0.65, 0.75, 0.82, 1.0].map(s => (
            <button key={s} onClick={() => setScale(s)}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                background: scale === s ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: scale === s ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 180ms ease',
              }}>
              {Math.round(s * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: 40,
        alignItems: 'flex-start',
        padding: '40px 32px',
        width: '100%',
        maxWidth: 1200,
      }}>

        {/* ── Screen picker ── */}
        <div style={{
          width: 180,
          flexShrink: 0,
          paddingTop: 8,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            Screens
          </p>
          {SCREENS.map(s => (
            <button key={s.href} onClick={() => setActive(s.href)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: active === s.href ? 600 : 400,
                background: active === s.href ? 'rgba(255,255,255,0.09)' : 'transparent',
                color: active === s.href ? '#fff' : 'rgba(255,255,255,0.4)',
                marginBottom: 2,
                transition: 'all 150ms ease',
              }}>
              {s.label}
            </button>
          ))}

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
              Custom URL
            </p>
            <input
              placeholder="/fragrance/..."
              onKeyDown={e => { if (e.key === 'Enter') setActive((e.target as HTMLInputElement).value) }}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                fontSize: 12,
                outline: 'none',
              }}
            />
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 6 }}>Press Enter to navigate</p>
          </div>

          <div style={{ marginTop: 20 }}>
            <a href={active} target="_blank" rel="noreferrer"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '8px 0',
                borderRadius: 6,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.08em',
              }}>
              Open in tab ↗
            </a>
          </div>
        </div>

        {/* ── Phone frame ── */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            position: 'relative',
            width: W + 24,
            height: H + 28,
          }}>
            {/* Outer shell */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 56,
              background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #222 100%)',
              boxShadow: `
                0 0 0 1px rgba(255,255,255,0.12),
                0 30px 80px rgba(0,0,0,0.8),
                0 8px 24px rgba(0,0,0,0.5),
                inset 0 1px 0 rgba(255,255,255,0.08)
              `,
            }} />

            {/* Left buttons — volume */}
            {[-130, -90].map((top, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: -3,
                top: top + 300,
                width: 3,
                height: 36,
                borderRadius: '2px 0 0 2px',
                background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
                boxShadow: '-1px 0 0 rgba(255,255,255,0.08)',
              }} />
            ))}
            {/* Left button — silent */}
            <div style={{
              position: 'absolute',
              left: -3,
              top: 200,
              width: 3,
              height: 24,
              borderRadius: '2px 0 0 2px',
              background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
              boxShadow: '-1px 0 0 rgba(255,255,255,0.08)',
            }} />

            {/* Right button — power */}
            <div style={{
              position: 'absolute',
              right: -3,
              top: 270,
              width: 3,
              height: 64,
              borderRadius: '0 2px 2px 0',
              background: 'linear-gradient(180deg, #2a2a2a, #1a1a1a)',
              boxShadow: '1px 0 0 rgba(255,255,255,0.08)',
            }} />

            {/* Screen bezel */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              bottom: 12,
              borderRadius: 46,
              background: '#000',
              overflow: 'hidden',
            }}>
              {/* Dynamic Island */}
              <div style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120,
                height: 36,
                borderRadius: 20,
                background: '#000',
                zIndex: 20,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
              }} />

              {/* iframe */}
              <iframe
                key={active}
                src={active}
                style={{
                  width: W,
                  height: H,
                  border: 'none',
                  display: 'block',
                  background: '#F7F3EE',
                }}
                title="Top Note Preview"
              />

              {/* Home indicator */}
              <div style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 130,
                height: 5,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.3)',
                zIndex: 20,
              }} />
            </div>
          </div>
        </div>

        {/* ── Info panel ── */}
        <div style={{ width: 160, flexShrink: 0, paddingTop: 8 }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
            Device
          </p>
          {[
            { label: 'Model',  val: 'iPhone 15 Pro' },
            { label: 'Width',  val: '393px' },
            { label: 'Height', val: '852px' },
            { label: 'Route',  val: active },
          ].map(row => (
            <div key={row.label} style={{ marginBottom: 12 }}>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginBottom: 2 }}>{row.label}</p>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 500, wordBreak: 'break-all' }}>{row.val}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
