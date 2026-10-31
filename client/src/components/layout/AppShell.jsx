import { NavLink } from 'react-router-dom'
import { Sidebar, NAV } from './Sidebar'
import { Topbar } from './Topbar'

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <div className="min-h-screen md:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-12">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-ink/10 bg-card px-2 py-2 md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium ${isActive ? 'bg-ink text-paper' : 'text-ink-soft'}`}>
            <Icon size={17} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
