import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ShieldCheck, UserRound } from 'lucide-react'
import { getAccount, setAccount } from '../lib/user'

const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

function GoogleSignIn({ onCredential, disabled }) {
  const containerRef = useRef(null)
  const callbackRef = useRef(onCredential)
  const [ready, setReady] = useState(false)
  useEffect(() => { callbackRef.current = onCredential }, [onCredential])
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current) return undefined
    let active = true
    const render = () => {
      if (!active || !window.google?.accounts?.id || !containerRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: response => { if (response?.credential) callbackRef.current(response.credential) },
        ux_mode: 'popup',
        auto_select: false,
      })
      containerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with',
        shape: 'rectangular', width: Math.min(containerRef.current.clientWidth || 360, 400),
      })
      setReady(true)
    }
    if (window.google?.accounts?.id) render()
    else {
      let script = document.querySelector('script[data-google-identity]')
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.dataset.googleIdentity = 'true'
        document.head.appendChild(script)
      }
      script.addEventListener('load', render, { once: true })
      script.addEventListener('error', () => setReady(false), { once: true })
    }
    return () => { active = false }
  }, [])
  if (!GOOGLE_CLIENT_ID) return <p className="rounded-lg bg-paper-dim px-3 py-2 text-center text-xs text-ink-soft">Google sign-in appears after VITE_GOOGLE_CLIENT_ID is configured in Vercel.</p>
  return <div className={disabled ? 'pointer-events-none opacity-50' : ''} aria-busy={!ready}><div ref={containerRef} className="flex min-h-10 justify-center"/></div>
}

async function post(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.')
    error.status = response.status
    throw error
  }
  return data
}

export default function Auth() {
  const navigate = useNavigate()
  const [account, setCurrentAccount] = useState(getAccount())
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState(account?.email || '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const onAuth = () => setCurrentAccount(getAccount())
    window.addEventListener('mangocode-auth-change', onAuth)
    return () => window.removeEventListener('mangocode-auth-change', onAuth)
  }, [])

  function changeMode(next) {
    setMode(next)
    setError('')
    setNotice('')
    setCode('')
    setPassword('')
    setNewPassword('')
  }

  function finish(data, message) {
    setAccount(data.user)
    setCurrentAccount(data.user)
    setNotice(message)
    setError('')
    navigate('/')
  }

  async function submit(event) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'login') {
        const data = await post('/api/auth/login', { email, password, legalAccepted })
        finish(data, 'Signed in. Your saved lessons and results are ready.')
      } else if (mode === 'register') {
        if (!legalAccepted) throw new Error('Please accept the Terms and Privacy Policy first.')
        const data = await post('/api/auth/register', { email, name, password, legalAccepted: true })
        setMode('verify')
        setCode('')
        setNotice('We sent a six-digit verification code to ' + data.email + '.')
      } else if (mode === 'verify') {
        const data = await post('/api/auth/verify-otp', { email, code })
        finish(data, 'Email verified. Your MangoCode account is ready.')
      } else if (mode === 'reset-request') {
        await post('/api/auth/password-reset/request', { email })
        setMode('reset-confirm')
        setNotice('If the account exists, a six-digit reset code has been sent.')
      } else if (mode === 'reset-confirm') {
        await post('/api/auth/password-reset/confirm', { email, code, newPassword })
        setMode('login')
        setPassword('')
        setCode('')
        setNewPassword('')
        setNotice('Password updated. Sign in with your new password.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally { setBusy(false) }
  }

  async function resendCode() {
    setBusy(true); setError(''); setNotice('')
    try {
      await post('/api/auth/resend-otp', { email })
      setNotice('A new verification code has been sent.')
    } catch (err) { setError(err.message || 'Could not resend the code.') }
    finally { setBusy(false) }
  }

  async function googleLogin(credential) {
    setBusy(true); setError(''); setNotice('')
    try {
      if (!legalAccepted) throw new Error('Please accept the Terms and Privacy Policy before continuing with Google.')
      const data = await post('/api/auth/google', { credential, legalAccepted: true })
      finish(data, 'Signed in with Google. Your learning progress is ready.')
    } catch (err) { setError(err.message || 'Google sign-in failed.') }
    finally { setBusy(false) }
  }

  async function logout() {
    setBusy(true)
    try { await post('/api/auth/logout', {}) } catch {}
    setAccount(null)
    setCurrentAccount(null)
    setBusy(false)
    changeMode('login')
  }

  if (account) {
    return <div className="mx-auto max-w-xl py-8">
      <div className="rounded-xl border border-ink/10 bg-card p-6 sm:p-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15}/> Back to learning</Link>
        <div className="mt-7 flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-paper-dim text-lg font-bold">{String(account.name || 'M').slice(0,1).toUpperCase()}</div>
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-mango-deep">Your account</p><h2 className="truncate text-2xl font-bold">{account.name}</h2><p className="truncate text-sm text-ink-soft">{account.email}</p></div>
        </div>
        {account.isOwner && <p className="mt-5 inline-flex rounded-full border border-mango/50 bg-mango/10 px-3 py-1 text-xs font-bold text-mango-deep">OWNER</p>}
        <div className="mt-6 rounded-lg bg-paper-dim p-4 text-sm leading-6 text-ink-soft">
          Your account saves completed lessons, assessment scores and coding exercise results. Signing out does not delete saved results.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/results" className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-paper">View saved results</Link>
          <button type="button" onClick={logout} disabled={busy} className="rounded-lg border border-ink/15 px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper disabled:opacity-50">{busy ? 'Signing out…' : 'Sign out'}</button>
        </div>
      </div>
    </div>
  }

  const title = mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : mode === 'reset-request' ? 'Reset your password' : 'Choose a new password'
  const description = mode === 'login'
    ? 'Sign in to keep your course progress and coding results in sync.'
    : mode === 'register'
      ? 'Create a free account. Verify your email before your account is activated.'
      : mode === 'verify'
        ? 'Enter the six-digit code we sent to your inbox. The code expires after 10 minutes.'
        : mode === 'reset-request'
          ? 'Enter the email address on your account. If it exists, we will send a reset code.'
          : 'Enter the six-digit reset code and a new password.'

  return <div className="mx-auto max-w-xl py-7">
    <section className="rounded-xl border border-ink/10 bg-card p-6 sm:p-8">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"><ArrowLeft size={15}/> Back</Link>
      <div className="mt-6 flex items-center gap-3">
        <img src="/logo-dark-bg.svg" alt="" className="h-10 w-10 rounded-lg"/>
        <div><p className="text-xs font-bold uppercase tracking-widest text-mango-deep">MangoCode</p><h1 className="text-2xl font-bold">{title}</h1></div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-soft">{description}</p>

      {(mode === 'login' || mode === 'register') && <>
        <div className="mt-6 space-y-3">
          <GoogleSignIn onCredential={googleLogin} disabled={busy}/>
          <div className="flex items-center gap-3 text-xs text-ink-soft"><span className="h-px flex-1 bg-ink/10"/><span>or continue with email</span><span className="h-px flex-1 bg-ink/10"/></div>
        </div>
      </>}

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === 'register' && <label className="block"><span className="mb-1.5 block text-sm font-semibold">Your name</span><input value={name} onChange={e => setName(e.target.value)} required maxLength={60} autoComplete="name" className="w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-3 text-sm outline-none focus:border-mango-deep" placeholder="Name"/></label>}
        {(mode === 'login' || mode === 'register' || mode === 'verify' || mode === 'reset-request' || mode === 'reset-confirm') && <label className="block"><span className="mb-1.5 block text-sm font-semibold">Email address</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={254} autoComplete="email" disabled={mode === 'verify' || mode === 'reset-confirm'} className="w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-3 text-sm outline-none focus:border-mango-deep disabled:opacity-70" placeholder="you@example.com"/></label>}
        {(mode === 'login' || mode === 'register') && <label className="block"><span className="mb-1.5 block text-sm font-semibold">Password</span><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-3 pr-12 text-sm outline-none focus:border-mango-deep" placeholder="At least 8 characters"/><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-3 text-ink-soft">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>}
        {(mode === 'verify' || mode === 'reset-confirm') && <label className="block"><span className="mb-1.5 block text-sm font-semibold">Six-digit code</span><input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0,6))} required className="w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-3 font-mono text-lg tracking-[.35em] outline-none focus:border-mango-deep" placeholder="000000"/></label>}
        {mode === 'reset-confirm' && <label className="block"><span className="mb-1.5 block text-sm font-semibold">New password</span><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" className="w-full rounded-lg border border-ink/15 bg-paper px-3.5 py-3 text-sm outline-none focus:border-mango-deep" placeholder="At least 8 characters"/></label>}

        {(mode === 'register' || mode === 'login') && <label className="flex items-start gap-2.5 text-xs leading-5 text-ink-soft"><input type="checkbox" checked={legalAccepted} onChange={e => setLegalAccepted(e.target.checked)} className="mt-1 accent-mango-deep"/><span>I have read and agree to the <Link to="/terms" target="_blank" className="font-semibold underline">Terms</Link> and <Link to="/privacy" target="_blank" className="font-semibold underline">Privacy Policy</Link>.</span></label>}

        {error && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/5 p-3 text-sm text-rose">{error}</p>}
        {notice && <p role="status" className="rounded-lg border border-leaf/30 bg-leaf/5 p-3 text-sm text-leaf">{notice}</p>}

        <button type="submit" disabled={busy || ((mode === 'register' || mode === 'login') && !legalAccepted && mode === 'register')} className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-50">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'register' ? 'Send verification code' : mode === 'verify' ? 'Verify and create account' : mode === 'reset-request' ? 'Send reset code' : 'Reset password'}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {mode === 'login' && <><button type="button" onClick={() => changeMode('register')} className="font-semibold text-ink underline underline-offset-4">Create an account</button><button type="button" onClick={() => changeMode('reset-request')} className="text-ink-soft underline underline-offset-4">Forgot password?</button></>}
        {mode === 'register' && <button type="button" onClick={() => changeMode('login')} className="font-semibold text-ink-soft underline underline-offset-4">Already have an account? Sign in</button>}
        {mode === 'verify' && <><button type="button" onClick={resendCode} disabled={busy} className="font-semibold text-ink underline underline-offset-4 disabled:opacity-50">Resend code</button><button type="button" onClick={() => changeMode('register')} className="text-ink-soft underline underline-offset-4">Change email</button></>}
        {(mode === 'reset-request' || mode === 'reset-confirm') && <button type="button" onClick={() => changeMode('login')} className="font-semibold text-ink-soft underline underline-offset-4">Back to sign in</button>}
      </div>
      <p className="mt-6 flex items-center gap-2 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-soft"><ShieldCheck size={15} className="shrink-0"/> Your password is stored as a cryptographic hash. Session cookies are HttpOnly and Secure.</p>
    </section>
  </div>
}
