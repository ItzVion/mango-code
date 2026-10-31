import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Sidebar, NAV } from './Sidebar'
import { Topbar } from './Topbar'
import { Footer } from './Footer'
import BugReportButton from '../BugReportButton'
import { getAccount, setAccount } from '../../lib/user'
import { ShieldCheck } from 'lucide-react'

export function AppShell({ children }) {
  const [maintenance,setMaintenance] = useState(false)
  const [account,setCurrentAccount] = useState(getAccount())
  const [sidebarCollapsed,setSidebarCollapsed] = useState(() => { try { return window.localStorage.getItem('mangocode-sidebar-collapsed') === 'true' } catch { return false } })
  useEffect(() => { try { window.localStorage.setItem('mangocode-sidebar-collapsed', String(sidebarCollapsed)) } catch {} }, [sidebarCollapsed])
  useEffect(() => {
    fetch('/api/status',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>setMaintenance(Boolean(d?.maintenanceMode))).catch(()=>{})
  },[])
  useEffect(() => {
    const sync = () => setCurrentAccount(getAccount())
    window.addEventListener('mangocode-auth-change', sync)
    return () => window.removeEventListener('mangocode-auth-change', sync)
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Session unavailable')
        return response.json()
      })
      .then(data => { if (active) { setAccount(data.user || null); setCurrentAccount(data.user || null) } })
      .catch(() => {})
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed(value => !value)} />
      <div className={'flex min-h-screen flex-col transition-[padding] duration-200 ' + (sidebarCollapsed ? 'md:pl-[76px]' : 'md:pl-64')}>
        <Topbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-6 sm:px-6 md:px-8 md:pb-12">{maintenance && <div role="status" className="mb-5 rounded-xl border border-mango/40 bg-mango/10 px-4 py-3 text-sm font-medium text-ink">MangoCode is in maintenance mode. Some learning and account services are temporarily paused.</div>}{children}</main>
        <Footer />
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-ink/10 bg-card px-2 py-2 md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => 'flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium ' + (isActive ? 'bg-ink text-paper' : 'text-ink-soft')}>
            <Icon size={17}/><span>{label}</span>
          </NavLink>
        ))}
        {account?.isOwner && <NavLink to="/admin" className={({ isActive }) => 'flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium ' + (isActive ? 'bg-ink text-paper' : 'text-ink-soft')}><ShieldCheck size={17}/><span>Admin</span></NavLink>}
      </nav>
      <BugReportButton />
    </div>
  )
}
