import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Bell, Search, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAccount } from '../../lib/user'

export function Topbar({ name }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const [account, setAccount] = useState(getAccount())
  useEffect(() => { const onAuth = () => setAccount(getAccount()); window.addEventListener('mangocode-auth-change', onAuth); return () => window.removeEventListener('mangocode-auth-change', onAuth) }, [])
  const display = account?.name || name || 'there'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-ink/5 bg-paper/80 px-6 py-4 backdrop-blur-xl md:px-8">
      <div><motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-ink-soft">{greeting}</motion.p><motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-semibold">{display} 👋</motion.h1></div>
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-ink/10 bg-card/80 px-4 py-2 text-sm text-ink-soft"><Search size={15}/><span>Search lessons…</span></div>
        <button aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-card text-ink-soft hover:text-ink"><Bell size={17}/></button>
        <Link to="/auth" aria-label="Account" className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-mango to-ember text-ink shadow-sm">{account?.name ? account.name.slice(0,1).toUpperCase() : <UserRound size={17}/>}</Link>
      </div>
    </header>
  )
}
