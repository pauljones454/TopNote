import { Sidebar } from './Sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <Sidebar />
      {/* Main content — offset for sidebar on desktop, padding bottom for mobile nav */}
      <main className="md:ml-[220px] pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}
