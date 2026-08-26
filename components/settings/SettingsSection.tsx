type SettingsSectionProps = {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

/** The card chrome every settings section shares — eyebrow, serif title, ambient shadow. */
export function SettingsSection({ eyebrow, title, description, children }: SettingsSectionProps) {
  return (
    <section
      className="rounded-2xl bg-white/60 px-6 py-6"
      style={{
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <p className="text-[9px] font-bold tracking-[2px] uppercase text-stone-400 mb-1">{eyebrow}</p>
      <h2 className="font-serif text-lg text-stone-900">{title}</h2>
      <p className="text-sm text-stone-400 leading-relaxed mt-1 mb-6">{description}</p>
      {children}
    </section>
  )
}
