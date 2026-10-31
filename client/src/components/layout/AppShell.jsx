import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Sidebar, NAV } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'
import BugReportButton from '../BugReportButton'
import { setAccount } from '../../lib/user'

export function AppShell({ children }) {
  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Session unavailable')
        return response.json()
      })
      .then(data => { if (active) setAccount(data.user || null) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar />
      <div className="flex min-h-screen flex-col md:pl-64">
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-12">{children}</main>
        <Footer />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-ink/10 bg-card px-2 py-2 md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => 'flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium ' + (isActive ? 'bg-ink text-paper' : 'text-ink-soft')}>
            <Icon size={17}/><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <BugReportButton />
    </div>
  )
}
