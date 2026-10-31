import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Code2, Braces, Hash, FileCode2, UserRound } from 'lucide-react'
import { cn } from '../../lib/utils'

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/course/html-css', label: 'HTML & CSS', icon: FileCode2 },
  { to: '/course/javascript', label: 'JavaScript', icon: Braces },
  { to: '/course/python', label: 'Python', icon: Code2 },
  { to: '/course/c', label: 'C', icon: Hash },
  { to: '/course/cpp', label: 'C++', icon: Hash },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink/10 bg-card px-5 py-6 md:flex">
      <NavLink to="/" className="mb-9 flex items-center gap-3 px-2">
        <img src="/logo-dark-bg.svg" alt="" className="h-8 w-8 rounded-lg object-cover" />
        <span className="font-display text-lg font-bold tracking-tight">MangoCode</span>
      </NavLink>
      <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Learn to code</p>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors', isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-dim hover:text-ink')}>
            <Icon size={17} strokeWidth={2} />{label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto border-t border-ink/10 pt-4">
        <NavLink to="/auth" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-dim hover:text-ink"><UserRound size={17}/> Account</NavLink>
        <p className="mt-4 px-3 text-xs leading-5 text-ink-soft">A practical path from your first line of code to complete projects.</p>
      </div>
    </aside>
  )
}
