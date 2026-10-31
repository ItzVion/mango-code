import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Code2, Braces, Hash, FileCode2, UserRound, PanelLeftClose, PanelLeftOpen, ShieldCheck, Heart } from 'lucide-react'
import { cn } from '../../lib/utils'
import { getAccount } from '../../lib/user'

export const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/course/html-css', label: 'HTML & CSS', icon: FileCode2 },
  { to: '/course/javascript', label: 'JavaScript', icon: Braces },
  { to: '/course/python', label: 'Python', icon: Code2 },
  { to: '/course/c', label: 'C', icon: Hash },
  { to: '/course/cpp', label: 'C++', icon: Hash },
  { to: '/donations', label: 'Support MangoCode', icon: Heart },
]

export function Sidebar({ collapsed = false, onToggleCollapsed = () => {} }) {
  const [account, setAccount] = useState(getAccount())
  useEffect(() => {
    const sync = () => setAccount(getAccount())
    window.addEventListener('mangocode-auth-change', sync)
    return () => window.removeEventListener('mangocode-auth-change', sync)
  }, [])
  const isOwner = Boolean(account?.isOwner || account?.role === 'OWNER')
  const navClass = ({ isActive }) => cn(
    'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-dim hover:text-ink',
    collapsed && 'justify-center px-0'
  )
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-ink/10 bg-card px-3 py-5 transition-[width] duration-200 md:flex', collapsed ? 'w-[76px]' : 'w-64')}>
      <div className={cn('mb-7 flex items-center', collapsed ? 'justify-center' : 'justify-between px-2')}>
        <NavLink to="/" className="flex min-w-0 items-center gap-3" aria-label="MangoCode home">
          <img src="/logo-dark-bg.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          {!collapsed && <span className="font-display text-lg font-bold tracking-tight">MangoCode</span>}
        </NavLink>
        {!collapsed && <button type="button" onClick={onToggleCollapsed} aria-label="Collapse sidebar" title="Collapse sidebar" className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-soft hover:bg-paper-dim hover:text-ink"><PanelLeftClose size={17}/></button>}
      </div>
      {collapsed && <button type="button" onClick={onToggleCollapsed} aria-label="Expand sidebar" title="Expand sidebar" className="mb-5 mx-auto grid h-9 w-9 place-items-center rounded-lg border border-ink/10 text-ink-soft hover:bg-paper-dim hover:text-ink"><PanelLeftOpen size={17}/></button>}
      {!collapsed && <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Learn to code</p>}
      <nav aria-label="Learning navigation" className="flex flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} title={collapsed ? label : undefined} aria-label={label} className={navClass}>
            <Icon size={17} strokeWidth={2} className="shrink-0"/>{!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
        {isOwner && <div className={cn('mt-4 border-t border-ink/10 pt-4', collapsed && 'mt-3 pt-3')}>
          {!collapsed && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">Management</p>}
          <NavLink to="/admin" title={collapsed ? 'Admin' : undefined} aria-label="Admin" className={navClass}>
            <ShieldCheck size={17} className="shrink-0"/>{!collapsed && <span>Admin</span>}
          </NavLink>
        </div>}
      </nav>
      <div className="mt-auto border-t border-ink/10 pt-4">
        <NavLink to="/auth" title={collapsed ? 'Account' : undefined} aria-label="Account" className={navClass}><UserRound size={17}/>{!collapsed && <span>Account</span>}</NavLink>
        {!collapsed && <p className="mt-4 px-3 text-xs leading-5 text-ink-soft">A practical path from your first line of code to complete projects.</p>}
      </div>
    </aside>
  )
}
