import { NavLink } from 'react-router-dom'
import { Sidebar, NAV } from './Sidebar'
import { Topbar } from './Topbar'
import { AnimationLayer } from '../motion/AnimationLayer'

export function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-paper">
      <AnimationLayer />
      <Sidebar />
      <div className="min-h-screen md:pl-64">
        <Topbar />
        <main className="px-4 pb-20 sm:px-5 md:px-8 md:pb-12">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex gap-1 overflow-x-auto border-t border-ink/10 bg-card/95 px-2 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex min-w-[76px] shrink-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium ${isActive ? 'bg-ink text-paper' : 'text-ink-soft'}`}
          >
            <Icon size={17} strokeWidth={2.25} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
