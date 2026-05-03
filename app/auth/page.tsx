import { AuthForm } from './AuthForm'

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-end pb-0">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center pb-8">
        <div className="text-center mb-3">
          <p className="font-serif text-[13px] tracking-[0.22em] uppercase font-bold text-white">TOP</p>
          <div className="h-px w-20 bg-white/20 my-1 mx-auto" />
          <p className="font-serif text-[13px] tracking-[0.22em] uppercase font-bold text-white">NOTE</p>
        </div>
        <p className="text-[11px] tracking-[2px] uppercase text-white/40 mt-2">Find your note.</p>
      </div>
      {/* Auth sheet */}
      <div className="w-full max-w-[480px] bg-[#F7F3EE] rounded-t-[32px] px-7 pt-8 pb-12">
        <AuthForm />
      </div>
    </div>
  )
}
