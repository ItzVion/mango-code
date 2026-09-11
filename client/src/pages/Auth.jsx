import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, KeyRound, Mail, UserRound } from 'lucide-react'
import { apiHeaders, getAccount, getGuestId, setAccount } from '../lib/user'

export default function Auth() {
  const navigate = useNavigate()
  const [account, setCurrentAccount] = useState(getAccount())
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState(account?.email || '')
  const [name, setName] = useState(account?.name || '')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onAuth = () => setCurrentAccount(getAccount())
    window.addEventListener('mangocode-auth-change', onAuth)
    return () => window.removeEventListener('mangocode-auth-change', onAuth)
  }, [])

  async function submit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { email, password, guestId: getGuestId() }
        : { email, password, name, guestId: getGuestId() }
      const res = await fetch(endpoint, { method: 'POST', credentials: 'include', headers: apiHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not complete that request.')
      setAccount(data.user)
      setCurrentAccount(data.user)
      setMessage(mode === 'login' ? 'Welcome back! Your progress is ready.' : 'Account created! Your guest progress has been linked.')
      setTimeout(() => navigate('/'), 650)
    } catch (err) { setError(err.message || 'Something went wrong.') }
    finally { setLoading(false) }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: apiHeaders() }).catch(() => {})
    setAccount(null); setCurrentAccount(null); setPassword(''); setMessage('Signed out.')
  }

  if (account) return (
    <div className="mx-auto max-w-lg py-14">
      <div className="rounded-[2rem] border border-ink/10 bg-card p-7 shadow-xl shadow-ink/5">
        <div className="mb-6 flex items-center gap-3"><img src="/logo-dark-bg.svg" className="h-12 w-12 rounded-2xl" alt="MangoCode" /><div><p className="text-xs font-bold uppercase tracking-widest text-mango-deep">Your account</p><h2 className="text-2xl font-semibold">{account.name}</h2><p className="text-sm text-ink-soft">{account.email}</p></div></div>
        <p className="rounded-2xl bg-leaf/10 p-4 text-sm text-ink-soft">Your course progress is saved to your MangoCode account. Signing out does not delete your progress.</p>
        <button onClick={logout} className="mt-5 w-full rounded-full border border-ink/10 px-5 py-3 font-semibold hover:bg-ink/5">Sign out</button>
        <Link to="/" className="mt-3 flex items-center justify-center gap-2 text-sm text-ink-soft"><ArrowLeft size={14}/> Back to learning</Link>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-lg py-14">
      <motion.div initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-card p-7 shadow-2xl shadow-ink/10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-mango/20 blur-3xl" />
        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={14}/> Back</Link>
          <div className="mt-8 flex items-center gap-3"><img src="/logo-dark-bg.svg" className="h-12 w-12 rounded-2xl" alt="MangoCode" /><div><p className="text-xs font-bold uppercase tracking-widest text-mango-deep">MangoCode</p><h1 className="text-3xl font-semibold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1></div></div>
          <p className="mt-3 text-sm leading-6 text-ink-soft">{mode === 'login' ? 'Continue your lessons, tests, streaks and coding practice.' : 'Save your learning progress across devices. Your password is stored only as a slow cryptographic hash.'}</p>
          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-ink/5 p-1">{['login','register'].map((m) => <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }} className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${mode === m ? 'bg-card shadow-sm' : 'text-ink-soft'}`}>{m === 'login' ? 'Sign in' : 'Create account'}</button>)}</div>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === 'register' && <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">Name</span><div className="relative"><UserRound className="absolute left-3 top-3.5 text-ink-soft" size={17}/><input value={name} onChange={e => setName(e.target.value)} required maxLength={60} className="w-full rounded-2xl border border-ink/10 bg-paper py-3 pl-10 pr-4 outline-none focus:border-mango" placeholder="Your name" /></div></label>}
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">Email</span><div className="relative"><Mail className="absolute left-3 top-3.5 text-ink-soft" size={17}/><input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} autoComplete="email" className="w-full rounded-2xl border border-ink/10 bg-paper py-3 pl-10 pr-4 outline-none focus:border-mango" placeholder="you@example.com" /></div></label>
            <label className="block"><span className="mb-1.5 block text-xs font-semibold text-ink-soft">Password</span><div className="relative"><KeyRound className="absolute left-3 top-3.5 text-ink-soft" size={17}/><input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-2xl border border-ink/10 bg-paper py-3 pl-10 pr-11 outline-none focus:border-mango" placeholder="8–128 characters" /><button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-3 text-ink-soft" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
            <p className="text-xs text-ink-soft">Use a long, unique password. MangoCode never stores the original password.</p>
            <AnimatePresence>{error && <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="rounded-xl bg-rose/10 p-3 text-sm text-rose">{error}</motion.p>}{message && <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="rounded-xl bg-leaf/10 p-3 text-sm text-leaf">{message}</motion.p>}</AnimatePresence>
            <motion.button whileHover={{scale:1.01}} whileTap={{scale:.98}} disabled={loading} className="w-full rounded-full bg-mango px-5 py-3 font-semibold text-ink shadow-lg shadow-mango/20 disabled:opacity-60">{loading ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}</motion.button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-ink-soft">Guest mode still works. An account is only needed for cloud-saved progress across devices.</p>
        </div>
      </motion.div>
    </div>
  )
}
