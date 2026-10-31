import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { getAccount } from '../../lib/user'

export function Topbar({ name }) {
  const location = useLocation()
  const [account, setAccount] = useState(getAccount())
  useEffect(() => {
    const onAuth = () => setAccount(getAccount())
    window.addEventListener('mangocode-auth-change', onAuth)
    return () => window.removeEventListener('mangocode-auth-change', onAuth)
  }, [])
  const display = account?.name || name || 'Learner'
  const section = location.pathname.startsWith('/lesson/') ? 'Lesson' : location.pathname.startsWith('/course/') ? 'Course' : location.pathname === '/auth' ? 'Account' : 'Learning workspace'

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-ink/10 bg-paper px-4 py-4 sm:px-6 md:px-8">
      <div>
        <p className="text-xs font-medium text-ink-soft">{section}</p>
        <h1 className="mt-0.5 text-lg font-semibold sm:text-xl">Welcome back, {display}</h1>
      </div>
      <Link to="/auth" aria-label="Account" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink/15 bg-card text-ink-soft hover:bg-paper-dim">
        {account?.name ? <span className="font-semibold">{account.name.slice(0, 1).toUpperCase()}</span> : <UserRound size={17}/>}
      </Link>
    </header>
  )
}
